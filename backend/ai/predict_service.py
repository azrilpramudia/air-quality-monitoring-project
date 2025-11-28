import sys
import json
import joblib
import numpy as np
import traceback

MODEL_PATH = "./models/xgb_multi.pkl"

# ===== LOAD MODEL =====
try:
    model = joblib.load(MODEL_PATH)
except Exception as e:
    print(json.dumps({"error": f"Failed to load model: {str(e)}"}))
    sys.stdout.flush()
    sys.exit(1)

# Safety filter untuk angka
def safe(v):
    try:
        return float(v)
    except:
        return 0.0

# ===== MAIN LOOP =====
while True:
    try:
        raw_input = sys.stdin.readline()
        if not raw_input:
            break
        
        raw_input = raw_input.strip()
        if raw_input == "":
            continue

        data = json.loads(raw_input)

        # Siapkan fitur sesuai urutan training
        features = np.array([
            safe(data.get("temperature")),
            safe(data.get("humidity")),
            safe(data.get("tvoc")),
            safe(data.get("eco2")),
            safe(data.get("dust"))
        ]).reshape(1, -1)

        # Prediksi
        prediction = model.predict(features)

        if isinstance(prediction, np.ndarray):
            prediction = prediction.tolist()

        print(json.dumps({
            "prediction": prediction
        }))
        sys.stdout.flush()

    except Exception as e:
        error_msg = traceback.format_exc()
        print(json.dumps({"error": error_msg}))
        sys.stdout.flush()
