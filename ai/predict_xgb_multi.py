import os
import joblib
import pandas as pd
import numpy as np
from datetime import timedelta

# ========================================================
# 1. LOAD MODEL
# ========================================================
bundle_path = "models/xgb_multi.pkl"
if not os.path.exists(bundle_path):
    raise SystemExit("❌ Model belum ada. Jalankan dulu:  python train_xgb_multi.py")

bundle = joblib.load(bundle_path)

model       = bundle["model"]
features    = bundle["features"]
target_cols = bundle["target_cols"]
H           = bundle["H"]

print(f"Model loaded. Horizon = {H} menit ({H/1440:.2f} hari)")

# ========================================================
# 2. LOAD DATA terakhir (HARUS sama seperti saat training)
# ========================================================
data_path = "data/sensor.csv"
if not os.path.exists(data_path):
    raise SystemExit("❌ sensor.csv tidak ditemukan di folder data/")

df_raw = pd.read_csv(data_path)

# deteksi & parse ts
if "ts" in df_raw.columns:
    ts = pd.to_datetime(df_raw["ts"], errors="coerce", utc=True)
    df_raw = df_raw.set_index(ts).drop(columns=["ts"])
else:
    df_raw.index = pd.to_datetime(df_raw.index, unit="s", utc=True)

df_raw.index = df_raw.index.tz_localize(None)

# Resample ke 1 menit seperti training
df = (
    df_raw
    .asfreq("1min")
    .interpolate(limit_direction="both")
)

# ========================================================
# 3. Ambil BARIS TERAKHIR yang sudah preprocess
# ========================================================
# kita butuh fitur lengkap => kolom harus match dengan 'features'
X = df[features].copy()

# Ambil 1 baris terakhir
X_last = X.tail(1)

# Jika ada NA (biasanya lag feature), isi 0
X_last = X_last.fillna(0)

# ========================================================
# 4. PREDIKSI
# ========================================================
pred = model.predict(X_last)[0]  # hasil array 1 x (2H)

# pisahkan:
temp_pred = pred[:H]
tvoc_pred = pred[H:]

# bikin timestamp masa depan
start_ts = df.index.max() + timedelta(minutes=1)
future_ts = pd.date_range(start=start_ts, periods=H, freq="1min")

df_out = pd.DataFrame({
    "timestamp": future_ts,
    "temp_c_pred": temp_pred,
    "tvoc_ppb_pred": tvoc_pred
})

# ========================================================
# 5. SIMPAN KE FOLDER predict/
# ========================================================
os.makedirs("predict", exist_ok=True)

out_path = "predict/prediksi_1_minggu.csv"
df_out.to_csv(out_path, index=False)

print("====================================")
print("✅ Prediksi berhasil dibuat")
print("📁 File:", out_path)
print("====================================")
