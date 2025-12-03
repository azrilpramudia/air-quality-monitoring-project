from fastapi import FastAPI
import joblib
import numpy as np
import uvicorn
import os

app = FastAPI()

# Load pickle model
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "./models/xgb_multi.pkl")

model = joblib.load(MODEL_PATH)

@app.post("/predict")
async def predict(payload: dict):
    data = payload["data"]
    arr = np.array([data])
    pred = model.predict(arr)
    return {"prediction": float(pred[0])}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5000)
