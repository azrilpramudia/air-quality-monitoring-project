#!/usr/bin/env python3
"""
debug_timestamp.py
Script untuk memeriksa format timestamp di CSV
"""

import os
import pandas as pd

# Path ke CSV Anda
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_CSV = os.path.join(BASE_DIR, "..", "data", "sensor_clean.csv")

print(f"📂 Checking: {DATA_CSV}")
print("=" * 60)

# Load CSV
df = pd.read_csv(DATA_CSV)
print(f"✅ Loaded {len(df)} rows\n")

# Cek kolom timestamp
if "ts" not in df.columns:
    print("❌ Column 'ts' not found!")
    print(f"Available columns: {list(df.columns)}")
    exit(1)

# Ambil sample data
ts_col = df["ts"].astype(str).str.strip()
print("📊 Sample timestamp values (first 10):")
print("-" * 60)
for i, val in enumerate(ts_col.head(10), 1):
    print(f"{i:2d}. {val}")

print("\n" + "=" * 60)
print("📊 Sample timestamp values (last 10):")
print("-" * 60)
for i, val in enumerate(ts_col.tail(10), 1):
    print(f"{i:2d}. {val}")

print("\n" + "=" * 60)
print("🔍 Data type analysis:")
print("-" * 60)

# Cek apakah numeric
ts_numeric = pd.to_numeric(ts_col, errors="coerce")
numeric_count = ts_numeric.notna().sum()
print(f"Numeric values: {numeric_count}/{len(ts_col)}")

if numeric_count > 0:
    sample_val = ts_numeric.dropna().iloc[0]
    print(f"Sample numeric value: {sample_val}")
    print(f"Magnitude: {sample_val:.2e}")
    
    # Deteksi unit
    if sample_val > 1e18:
        unit = "nanoseconds"
    elif sample_val > 1e15:
        unit = "microseconds"
    elif sample_val > 1e12:
        unit = "milliseconds"
    elif sample_val > 1e9:
        unit = "seconds (Unix timestamp)"
    else:
        unit = "unknown (too small)"
    
    print(f"Detected unit: {unit}")
    
    # Coba convert
    print("\n🔧 Trying to parse as different units:")
    for u in ["s", "ms", "us", "ns"]:
        try:
            result = pd.to_datetime(ts_numeric.iloc[0], unit=u, utc=True)
            print(f"  {u:3s} → {result}")
        except:
            print(f"  {u:3s} → ❌ Failed")

print("\n" + "=" * 60)
print("💡 Recommendations:")
print("-" * 60)

# Cek unique values
unique_count = ts_col.nunique()
print(f"Unique timestamp values: {unique_count}")

if numeric_count == len(ts_col):
    print("✅ All values are numeric - should work with correct unit")
elif numeric_count > 0:
    print(f"⚠️  Mixed format: {numeric_count} numeric, {len(ts_col) - numeric_count} string")
else:
    print("📝 All values are strings - trying string parse...")
    
    # Coba parse sebagai string
    try:
        ts_parsed = pd.to_datetime(ts_col, errors="coerce", utc=True)
        valid = ts_parsed.notna().sum()
        print(f"   Valid parsed: {valid}/{len(ts_col)}")
        if valid > 0:
            print(f"   Sample: {ts_parsed.dropna().iloc[0]}")
    except Exception as e:
        print(f"   ❌ Error: {e}")

print("\n" + "=" * 60)