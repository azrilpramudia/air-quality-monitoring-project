import sys
import json
import joblib
import numpy as np
import traceback
import os

# ============================
# FIX MODEL PATH
# ============================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "models", "xgb_multi.pkl")

# ============================
# LOAD MODEL
# ============================
try:
    model = joblib.load(MODEL_PATH)
except Exception as e:
    print(json.dumps({"error": f"Failed to load model: {str(e)}"}))
    sys.stdout.flush()
    sys.exit(1)

# Safety parser
def safe(v):
    try:
        return float(v)
    except:
        return 0.0

# ============================
# MAIN LOOP
# ============================
while True:
    try:
        raw_input = sys.stdin.readline()
        if not raw_input:
            break

        raw_input = raw_input.strip()
        if raw_input == "":
            continue

        # Parse JSON from Node.js
        data = json.loads(raw_input)

        # Prepare features in correct order
        features = np.array([
            safe(data.get("temperature")),
            safe(data.get("humidity")),
            safe(data.get("tvoc")),
            safe(data.get("eco2")),
            safe(data.get("dust")),
        ]).reshape(1, -1)

        # =============== PREDICT ===============
        try:
            prediction = model.predict(features)
        except Exception as pe:
            print(json.dumps({"error": f"Prediction failed: {str(pe)}"}))
            sys.stdout.flush()
            continue

        # Convert numpy → normal Python
        if isinstance(prediction, np.ndarray):
            prediction = prediction.tolist()

        # Output result
        print(json.dumps({
            "prediction": prediction
        }))
        sys.stdout.flush()

    except Exception as e:
        error_msg = traceback.format_exc()
        print(json.dumps({"error": error_msg}))
        sys.stdout.flush()
