# Real-Time Face Detection Video Streaming System

A high-performance, containerized video streaming system that detects faces in real-time, stores Region of Interest (ROI) data in PostgreSQL, and draws axis-aligned bounding boxes using Pillow (no OpenCV).
![Alt Text](https://github.com/Tulasireddyn/Real-Time-Face-Detection-Video-Streaming-System/blob/main/Screenshot%202026-05-08%20121447.png)
![Alt Text](https://github.com/Tulasireddyn/Real-Time-Face-Detection-Video-Streaming-System/blob/main/Screenshot%202026-05-08%20121347.png)
## Tech Stack
- **Backend**: FastAPI (Python)
- **Face Detection**: MediaPipe
- **Image Processing**: Pillow (PIL)
- **Database**: PostgreSQL
- **Frontend**: React.js (Vite)
- **Containerization**: Docker & Docker Compose
- **Streaming**: WebSockets

## Features
- **Real-time video streaming** via WebSockets.
- **Advanced Face Detection** using MediaPipe.
- **Custom Head ROI**: Specifically tuned to include the forehead, hair, and neck for comprehensive facial data.
- **OpenCV-Free Drawing**: Axis-aligned minimal bounding box (ROI) drawing using **Pillow**.
- **Data Persistence**: Automatic storage of ROI coordinates in PostgreSQL (or SQLite local fallback).
- **Premium Dashboard**: Dark-themed, high-performance React UI.

## Quick Start (Run in 5 Minutes)

### Prerequisites
- Docker and Docker Compose installed.
- A webcam connected to your machine.

### Instructions
1. **Clone the repository** (or ensure you are in the project root).
2. **Run Docker Compose**:
   ```bash
   docker-compose up --build
   ```
3. **Access the System**:
   - **Frontend**: [http://localhost:3000](http://localhost:3000)
   - **Backend API**: [http://localhost:8000](http://localhost:8000)
   - **ROI History**: [http://localhost:8000/roi-data](http://localhost:8000/roi-data)

## Alternative: Local Setup (Without Docker)

If you do not have Docker installed, you can run the services locally:

### 1. Backend
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python main.py
```
*(Uses SQLite automatically when running locally)*

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

## Architecture
The system consists of three main containers:
1. **db**: PostgreSQL database for storing ROI data.
2. **backend**: FastAPI server handling WebSockets, face detection (MediaPipe), and DB persistence.
3. **frontend**: React application that captures webcam feed and displays the processed stream.

## API Endpoints
- `WS /ws/stream`: Bidirectional WebSocket for real-time video processing.
- `GET /roi-data`: Fetches historical ROI detection data from the database.
- `GET /docs`: FastAPI Swagger documentation.

## Notes on OpenCV
As per the requirements, **OpenCV is not used for drawing rectangles**. Instead, the system leverages the **Pillow** library for pixel-perfect axis-aligned bounding box rendering.
