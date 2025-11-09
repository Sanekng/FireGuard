import time
import numpy as np
import cv2
import tensorflow as tf
import requests
from datetime import datetime
import os

BACKEND_URL = os.getenv("BACKEND_URL", "http://backend:4000/api/alert")
CAMERA_ID = os.getenv("CAMERA_ID", "690de2f8681e49c3be38c4b7")
MODEL_PATH = "fire_detection_model.tflite"
IMAGE_PATH = "test.jpg"
INTERVAL = 30  # seconds

# Load TFLite model
interpreter = tf.lite.Interpreter(model_path=MODEL_PATH)
interpreter.allocate_tensors()
input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()

def predict_fire(frame):
    img = cv2.resize(frame, (256, 256))
    img = np.expand_dims(img / 255.0, axis=0).astype(np.float32)
    interpreter.set_tensor(input_details[0]['index'], img)
    interpreter.invoke()
    result = interpreter.get_tensor(output_details[0]['index'])[0][0]
    return result > 0.5

def send_alert(alert_type):
    try:
        payload = {
            "cameraId": CAMERA_ID,
            "alertType": alert_type,
            "timestamp": datetime.now().isoformat()
        }
        r = requests.post(BACKEND_URL, json=payload)
        print(f"[{datetime.now()}] Sent alert: {alert_type} -> {r.status_code}")
    except Exception as e:
        print("Error sending alert:", e)

def process():
    print("🔧 Starting fire detection loop...")
    while True:
        if not os.path.exists(IMAGE_PATH):
            print(f"No image found at {IMAGE_PATH}")
            time.sleep(INTERVAL)
            continue

        frame = cv2.imread(IMAGE_PATH)
        if frame is None:
            print("Failed to read image.")
            time.sleep(INTERVAL)
            continue

        fire = predict_fire(frame)
        send_alert("fire" if fire else "normal")
        time.sleep(INTERVAL)

if __name__ == "__main__":
    process()
