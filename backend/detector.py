import mediapipe as mp
import numpy as np
from PIL import Image, ImageDraw
import io

class FaceDetector:
    def __init__(self):
        self.mp_face_detection = mp.solutions.face_detection
        self.face_detection = self.mp_face_detection.FaceDetection(
            model_selection=0, min_detection_confidence=0.5
        )

    def process_frame(self, image_bytes):
        # Convert bytes to PIL Image
        image = Image.open(io.BytesIO(image_bytes))
        
        # Convert to RGB for MediaPipe (Pillow opens as RGB usually, but just in case)
        if image.mode != 'RGB':
            image = image.convert('RGB')
            
        image_np = np.array(image)
        results = self.face_detection.process(image_np)

        roi_data = None
        if results.detections:
            # Assume only one face as per requirements
            detection = results.detections[0]
            bbox = detection.location_data.relative_bounding_box
            
            ih, iw, _ = image_np.shape
            # Raw coordinates
            rx = bbox.xmin * iw
            ry = bbox.ymin * ih
            rw = bbox.width * iw
            rh = bbox.height * ih
            
            # Final tuned padding for a perfect "Head ROI" (Forehead to Neck)
            padding_top = rh * 0.45 
            padding_side = rw * 0.2
            padding_bottom = rh * 0.1
            
            x = max(0, rx - padding_side)
            y = max(0, ry - padding_top)
            w = min(iw - x, rw + (2 * padding_side))
            h = min(ih - y, rh + padding_top + padding_bottom)
            
            roi_data = {
                "x": x,
                "y": y,
                "width": w,
                "height": h
            }
            
            # Draw rectangle using Pillow
            draw = ImageDraw.Draw(image)
            draw.rectangle([x, y, x + w, y + h], outline="red", width=3)

        # Convert back to bytes
        img_byte_arr = io.BytesIO()
        image.save(img_byte_arr, format='JPEG')
        return img_byte_arr.getvalue(), roi_data

detector = FaceDetector()
