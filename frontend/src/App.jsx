import React, { useEffect, useRef, useState } from 'react';
import './App.css';

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [roiData, setRoiData] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [stats, setStats] = useState({ fps: 0, lastFrameTime: 0 });

  useEffect(() => {
    // Initialize WebSocket
    const ws = new WebSocket('ws://localhost:8000/ws/stream');
    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    };
    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.image) {
        setProcessedImage(`data:image/jpeg;base64,${data.image}`);
      }
      setRoiData(data.roi);
      
      const now = performance.now();
      if (stats.lastFrameTime > 0) {
        const fps = 1000 / (now - stats.lastFrameTime);
        setStats(prev => ({ fps: Math.round(fps), lastFrameTime: now }));
      } else {
        setStats(prev => ({ ...prev, lastFrameTime: now }));
      }
    };
    setSocket(ws);

    // Get Webcam
    navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play().catch(e => console.error("Play failed:", e));
          };
        }
      })
      .catch(err => console.error("Error accessing webcam:", err));

    return () => {
      if (ws) ws.close();
    };
  }, []);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const captureInterval = setInterval(() => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (video && 
          video.readyState >= 2 && 
          video.videoWidth > 0 &&
          video.videoHeight > 0 &&
          canvas && 
          socket.readyState === WebSocket.OPEN) {
        
        const context = canvas.getContext('2d');
        
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            blob.arrayBuffer().then(buffer => {
              if (socket.readyState === WebSocket.OPEN) {
                socket.send(buffer);
              }
            });
          }
        }, 'image/jpeg', 0.7);
      }
    }, 100);

    return () => clearInterval(captureInterval);
  }, [socket, isConnected]);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>VisionStream AI</h1>
        <div className={`status-badge ${isConnected ? 'online' : 'offline'}`}>
          {isConnected ? 'LIVE' : 'DISCONNECTED'}
        </div>
      </header>

      <main className="main-content">
        <div className="video-section">
          <div className="video-card">
            <h2>Real-Time Face Detection</h2>
            <div className="video-wrapper">
              {processedImage ? (
                <img src={processedImage} alt="Processed Stream" className="main-stream" />
              ) : (
                <div className="placeholder">Initializing Stream...</div>
              )}
              {/* Hidden elements for processing */}
              <video ref={videoRef} autoPlay playsInline muted style={{ display: 'none' }} />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>
            <div className="stream-stats">
              <span>FPS: {stats.fps}</span>
              <span>Resolution: 640x480</span>
            </div>
          </div>
        </div>

        <div className="data-section">
          <div className="roi-card">
            <h2>Region of Interest (ROI)</h2>
            {roiData ? (
              <div className="roi-details">
                <div className="data-item">
                  <span className="label">X Offset:</span>
                  <span className="value">{Math.round(roiData.x)}px</span>
                </div>
                <div className="data-item">
                  <span className="label">Y Offset:</span>
                  <span className="value">{Math.round(roiData.y)}px</span>
                </div>
                <div className="data-item">
                  <span className="label">Width:</span>
                  <span className="value">{Math.round(roiData.width)}px</span>
                </div>
                <div className="data-item">
                  <span className="label">Height:</span>
                  <span className="value">{Math.round(roiData.height)}px</span>
                </div>
              </div>
            ) : (
              <p className="no-data">No face detected</p>
            )}
          </div>

          <div className="info-card">
            <h3>System Info</h3>
            <p>Backend: FastAPI (Python)</p>
            <p>Detection: MediaPipe</p>
            <p>Drawing: Pillow (No OpenCV)</p>
            <p>Storage: PostgreSQL</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
