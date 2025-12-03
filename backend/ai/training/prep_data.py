import pandas as pd

raw = "data/sensor_raw.csv"
out = "data/sensor.csv"

# 1) Baca & rapikan
df = pd.read_csv(raw)
df = df.dropna(subset=["ts"])
df["ts"] = pd.to_datetime(df["ts"], unit="s", utc=True).dt.tz_convert("Asia/Jakarta")
df = df.sort_values("ts").drop_duplicates(subset=["ts"]).set_index("ts")

# 2) Pastikan kolom numerik benar-benar numeric
num_cols = ["temp_c","rh_pct","tvoc_ppb","eco2_ppm","dust_ugm3"]
for c in num_cols:
    if c in df.columns:
        df[c] = pd.to_numeric(df[c], errors="coerce")

# 3) permenit
df_num = df[num_cols].resample("1min").mean()

# 4) Isi celah kecil
df_num = df_num.interpolate(limit_direction="both")

# 5) (Opsional) bawa serta device_id dengan forward fill (ambil nilai terakhir)
if "device_id" in df.columns:
    dev = (
        df[["device_id"]]
        .resample("1min")
        .last()
        .ffill()
    )
    df_out = df_num.join(dev)
else:
    df_out = df_num

# 6) Simpan
df_out.to_csv(out)
print("saved:", out, "rows:", len(df_out), "cols:", list(df_out.columns))
