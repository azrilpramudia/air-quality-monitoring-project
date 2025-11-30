import xgboost as xgb
import numpy as np
import joblib
from fastapi import FastAPI
import uvicorn

# ====================== LOAD METADATA ======================
meta = joblib.load("models/xgb_native/metadata.pkl")
features = meta["features"]
target_cols = meta["target_cols"]
H = meta["H"]

# ====================== LOAD BOOSTERS ======================
models = []

for i in range(len(target_cols)):
    booster = xgb.Booster()
    booster.load_model(f"models/xgb_native/model_target_{i}.json")
    models.append(booster)

print("Loaded", len(models), "XGBoost boosters.")
print("Targets:", target_cols[:10], "...")

app = FastAPI()

# ====================== PREDICT API ======================
@app.post("/predict")
def predict(payload: dict):
    """
    payload = {
      "input": { "<feature_name>": value, ... }
    }
    """

    # Urutkan fitur sesuai training
    X = np.array([[payload["input"][f] for f in features]], dtype=np.float32)
    dmat = xgb.DMatrix(X)

    preds = []
    for booster in models:
        p = booster.predict(dmat)[0]
        preds.append(float(p))

    # Bungkus predictions
    result = {}
    for col, val in zip(target_cols, preds):
        result[col] = val

    return {
        "horizon": H,
        "prediction": result
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=9000)
