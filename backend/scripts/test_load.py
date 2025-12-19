import joblib
import os

path = r"C:\Users\azril\Documents\IOT-Project\air-quality-monitoring-project\backend\ai\models\rf_hourly_fixed.pkl"

model = joblib.load(path)

print("Loaded type:", type(model))

if isinstance(model, dict):
    print("Dictionary keys:", model.keys())
else:
    print("Not a dict. It is:", type(model))
