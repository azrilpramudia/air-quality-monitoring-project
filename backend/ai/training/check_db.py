# check_db.py — tampilkan 5 data terbaru
import os
import sqlite3
import datetime as dt
from zoneinfo import ZoneInfo

DB_PATH = os.path.join("data", "sensor.db")
WIB = ZoneInfo("Asia/Jakarta")

with sqlite3.connect(DB_PATH) as con:
    cur = con.cursor()

    n = cur.execute("SELECT COUNT(*) FROM sensor").fetchone()[0]
    tmin, tmax = cur.execute("SELECT MIN(ts), MAX(ts) FROM sensor").fetchone()

    last5 = cur.execute("""
        SELECT ts, device_id, temp_c, rh_pct, tvoc_ppb, eco2_ppm, dust_ugm3
        FROM sensor ORDER BY ts DESC LIMIT 5
    """).fetchall()

def to_wib(ts):
    return dt.datetime.fromtimestamp(ts, dt.UTC).astimezone(WIB).strftime("%Y-%m-%d %H:%M:%S%z")

def to_utc(ts):
    return dt.datetime.fromtimestamp(ts, dt.UTC).strftime("%Y-%m-%d %H:%M:%S")

print(f"DB: {DB_PATH}")
print("rows:", n)
print("ts range (UTC):", to_utc(tmin), "->", to_utc(tmax), "UTC")
print("ts range (WIB):", to_wib(tmin), "->", to_wib(tmax), "WIB\n")

print("Last 5 rows (WIB):")
for r in last5:
    ts, dev, t, rh, tvoc, eco2, dust = r
    print(f"{to_wib(ts)} WIB  {dev}  T={t} RH={rh} TVOC={tvoc} eCO2={eco2} Dust={dust}")
