#!/usr/bin/env python3
"""
ai/utils/clean_sensor_csv.py - FIXED VERSION
Properly handles Unix timestamp (seconds)
"""

import pandas as pd
from pathlib import Path

# ----------------------------------
# PATH RESOLUTION
# ----------------------------------
BASE_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = BASE_DIR / "data"

INPUT_CSV = DATA_DIR / "sensor_raw.csv"
OUTPUT_CSV = DATA_DIR / "sensor_clean.csv"

print("=" * 70)
print("🧹 SENSOR CSV CLEANER")
print("=" * 70)
print(f"\n📂 Input : {INPUT_CSV}")
print(f"📂 Output: {OUTPUT_CSV}")

if not INPUT_CSV.exists():
    raise FileNotFoundError(f"❌ CSV not found: {INPUT_CSV}")

# ----------------------------------
# LOAD DATA
# ----------------------------------
print("\n📥 Loading raw CSV...")
df = pd.read_csv(INPUT_CSV)
print(f"✅ Loaded {len(df)} rows")

# Fix weird column names
df = df.rename(columns=lambda c: c.strip())
print(f"📋 Columns: {list(df.columns)}")

if "ts" not in df.columns:
    raise ValueError("❌ Column 'ts' not found!")

# ----------------------------------
# SMART TIMESTAMP PARSING
# ----------------------------------
print("\n⏰ Parsing timestamps...")

ts_raw = df["ts"]

# Try to detect if numeric (Unix timestamp)
ts_numeric = pd.to_numeric(ts_raw, errors="coerce")
numeric_count = ts_numeric.notna().sum()

if numeric_count > len(df) * 0.8:  # Majority numeric
    print(f"✅ Detected numeric timestamps: {numeric_count}/{len(df)}")
    
    sample = ts_numeric.dropna().iloc[0]
    print(f"   Sample value: {sample:.0f}")
    
    # Detect unit by magnitude
    if sample > 1e18:
        unit = "ns"
        unit_name = "nanoseconds"
    elif sample > 1e15:
        unit = "us"
        unit_name = "microseconds"
    elif sample > 1e12:
        unit = "ms"
        unit_name = "milliseconds"
    elif sample > 1e9:
        unit = "s"
        unit_name = "seconds"
    else:
        raise ValueError(f"Timestamp value too small: {sample}")
    
    print(f"   Detected unit: {unit_name}")
    
    # Parse with correct unit
    df["ts"] = pd.to_datetime(ts_numeric, unit=unit, utc=True, errors="coerce")
    
else:
    # Try parsing as datetime string
    print("✅ Attempting string datetime parsing...")
    df["ts"] = pd.to_datetime(ts_raw, utc=True, errors="coerce")

# ----------------------------------
# VALIDATE
# ----------------------------------
valid_count = df["ts"].notna().sum()
print(f"\n📊 Valid timestamps: {valid_count}/{len(df)}")

if valid_count == 0:
    raise ValueError("❌ No valid timestamps! Check your data format.")

# Drop rows with invalid timestamps
before = len(df)
df = df.dropna(subset=["ts"])
after = len(df)

if before != after:
    print(f"⚠️  Dropped {before - after} rows with invalid timestamps")

# Sort by time
df = df.sort_values("ts").reset_index(drop=True)

# Show time range
print(f"\n📅 Time range:")
print(f"   Start: {df['ts'].min()}")
print(f"   End  : {df['ts'].max()}")
duration = df["ts"].max() - df["ts"].min()
print(f"   Duration: {duration}")

# ----------------------------------
# SAVE CLEANED DATA
# ----------------------------------
print(f"\n💾 Saving cleaned CSV...")
df.to_csv(OUTPUT_CSV, index=False)

print(f"✅ Cleaned CSV saved to: {OUTPUT_CSV}")
print(f"📊 Final rows: {len(df)}")
print(f"📊 Columns: {list(df.columns)}")
print("\n" + "=" * 70)
print("✨ Ready for training!")
print("=" * 70)