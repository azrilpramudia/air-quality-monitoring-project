import joblib

MODEL_PATH = r"./models/xgb_multi.pkl"

print("Loading model from:", MODEL_PATH)

try:
    model = joblib.load(MODEL_PATH)
    print("✅ Model loaded OK!")
    print("Model type:", type(model))
except Exception as e:
    print("❌ ERROR while loading model:")
    print(e)
