from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import json
import base64
from datetime import datetime

from database import init_db, get_db, FaceDetection
from detector import detector

app = FastAPI(title="Face Detection Streaming API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    init_db()

@app.get("/roi-data")
def get_roi_data(db: Session = Depends(get_db), limit: int = 100):
    return db.query(FaceDetection).order_by(FaceDetection.timestamp.desc()).limit(limit).all()

@app.get("/latest-roi")
def get_latest_roi(db: Session = Depends(get_db)):
    return db.query(FaceDetection).order_by(FaceDetection.timestamp.desc()).first()

@app.websocket("/ws/stream")
async def websocket_endpoint(websocket: WebSocket, db: Session = Depends(get_db)):
    await websocket.accept()
    try:
        while True:
            # Receive data from frontend
            # Expecting binary data (image frames)
            data = await websocket.receive_bytes()
            
            # Process frame
            processed_bytes, roi = detector.process_frame(data)
            
            if roi:
                # Store ROI in DB
                new_detection = FaceDetection(
                    x=roi["x"],
                    y=roi["y"],
                    width=roi["width"],
                    height=roi["height"]
                )
                # We need a new session or use the provided one
                # Since this is a loop, we might want to batch or just commit each
                db.add(new_detection)
                db.commit()

            # Send back processed frame and ROI data
            # We'll send it as a JSON containing the base64 image and the ROI data
            response = {
                "image": base64.b64encode(processed_bytes).decode('utf-8'),
                "roi": roi
            }
            await websocket.send_text(json.dumps(response))
            
    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        print(f"Error: {e}")
        await websocket.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
