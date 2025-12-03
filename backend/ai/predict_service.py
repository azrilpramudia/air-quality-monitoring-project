from fastapi import FastAPI
import joblib
import numpy as np
import uvicorn
import os

app = FastAPI()

# --------------------------------------
# Load pickle model (safe & cross-platform)
# --------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "models", "xgb_multi.pkl")

print("Loading model from:", MODEL_PATH)

try:
    model = joblib.load(MODEL_PATH)
    print("Model loaded successfully!")
except Exception as e:
    print("Failed to load model:", e)
    raise e


# --------------------------------------
# Prediction endpoint
# --------------------------------------
@app.post("/predict")
async def predict(payload: dict):
    data = payload["data"]     # expects: [feature1, feature2, ...]
    arr = np.array([data])     # shape (1, n_features)

    pred = model.predict(arr)

    return {
        "prediction": float(pred[0])
    }


# --------------------------------------
# Run service
# --------------------------------------
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5000)
