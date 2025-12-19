import os
import joblib
import xgboost as xgb

# ======================
# LOAD xgb_multi.pkl
# ======================
bundle_path = "models/xgb_multi.pkl"
print("[INFO] Loading:", bundle_path)

bundle = joblib.load(bundle_path)
model = bundle["model"]

features = bundle["features"]
target_cols = bundle["target_cols"]
lag_minutes = bundle["lag_minutes"]
H = bundle["H"]
freq = bundle["freq"]
base_cols = bundle["base_cols"]

print("[INFO] Total targets:", len(target_cols))
print("[INFO] Extracting model for recursive horizon...")

# ======================
# OUTPUT FOLDER
# ======================
outdir = "models/xgb_native_recursive"
os.makedirs(outdir, exist_ok=True)

# ======================
# Extract ONLY Horizon-1 models:
#   - temp:  y_temp+1
#   - tvoc:  y_tvoc+1
# ======================

# 1) cari index masing-masing target
temp_1_index = target_cols.index("y_temp+1")
tvoc_1_index = target_cols.index("y_tvoc+1")

# 2) ambil estimator XGBoost dari MultiOutputRegressor
temp_est = model.estimators_[temp_1_index]
tvoc_est = model.estimators_[tvoc_1_index]

# 3) simpan sebagai model JSON resmi XGBoost
temp_est.save_model(os.path.join(outdir, "temp_model.json"))
tvoc_est.save_model(os.path.join(outdir, "tvoc_model.json"))

print("[OK] Saved:")
print(" -", os.path.join(outdir, "temp_model.json"))
print(" -", os.path.join(outdir, "tvoc_model.json"))

# ======================
# SAVE METADATA
# ======================
metadata = {
    "features": features,
    "lag_minutes": lag_minutes,
    "H": H,
    "freq": freq,
    "base_cols": base_cols,
    "target_order": {
        "temp": "y_temp+1",
        "tvoc": "y_tvoc+1"
    }
}

joblib.dump(metadata, os.path.join(outdir, "metadata.pkl"))
print("[OK] Saved metadata.pkl")

print("\n🎉 DONE bro! Model recursive siap dipakai backend.")
