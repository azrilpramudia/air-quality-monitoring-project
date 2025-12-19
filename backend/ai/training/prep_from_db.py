# prep_from_db.py — export dari SQLite ke data/sensor.csv
import sqlite3, pandas as pd, os

DB_PATH = "data/sensor.db"
TABLE   = "sensor"
OUT_CSV = "data/sensor_raw.csv"

os.makedirs("data", exist_ok=True)
con = sqlite3.connect(DB_PATH)

# cek tabel ada
tbls = [r[0] for r in con.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
if TABLE not in tbls:
    raise SystemExit(f"Tabel '{TABLE}' tidak ditemukan di {DB_PATH}. Tersedia: {tbls}")

df = pd.read_sql_query(f"SELECT * FROM {TABLE} ORDER BY ts", con)
con.close()

assert "ts" in df.columns, "Kolom 'ts' harus ada (epoch detik UTC)."
df.to_csv(OUT_CSV, index=False)
print("✅ exported ->", OUT_CSV, "rows:", len(df))
