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
MODEL_PATH = os.path.join(BASE_DIR, "..", "models", "xgb_multi.pkl")
MODEL_PATH = os.path.abspath(MODEL_PATH)

print("Loading model from:", MODEL_PATH)

try:
    saved = joblib.load(MODEL_PATH)
    print("Loaded type:", type(saved))

    if isinstance(saved, dict):
        model = saved["model"]              # actual ML model
        features = saved["features"]        # LIST OF INPUT FEATURES
        target_cols = saved["target_cols"]  # LIST OF OUTPUT COLUMNS

        print("Extracted trained model from dict.")
        print("FEATURE LIST:", features)
        print("NUMBER OF FEATURES:", len(features))
        print("TARGET COLS:", target_cols)

    else:
        model = saved
        features = None
        target_cols = None
        print("Model loaded (not dict format).")

    print("Model loaded successfully!")

except Exception as e:
    print("❌ Failed to load model:", e)
    raise e


# --------------------------------------
# Prediction endpoint
# --------------------------------------
@app.post("/predict")
async def predict(payload: dict):
    data = payload["data"]     
    arr = np.array([data])     

    pred = model.predict(arr)

    if hasattr(pred[0], "__len__"):
        pred_value = [float(x) for x in pred[0]]
    else:
        pred_value = float(pred[0])

    return {
        "prediction": pred_value,
        "target_cols": target_cols
    }


# --------------------------------------
# Run service
# --------------------------------------
if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8500, reload=True)
