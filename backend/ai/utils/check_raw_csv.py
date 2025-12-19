#!/usr/bin/env python3
"""
check_raw_csv.py
Memeriksa format timestamp di sensor_raw.csv
"""

import pandas as pd
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = BASE_DIR / "data"
RAW_CSV = DATA_DIR / "sensor_raw.csv"

print("=" * 70)
print("🔍 CHECKING SENSOR_RAW.CSV")
print("=" * 70)

if not RAW_CSV.exists():
    print(f"❌ File not found: {RAW_CSV}")
    exit(1)

print(f"\n📂 Reading: {RAW_CSV}")
df = pd.read_csv(RAW_CSV)

print(f"✅ Loaded {len(df)} rows")
print(f"📋 Columns: {list(df.columns)}\n")

# Cek kolom timestamp
ts_candidates = [c for c in df.columns if 'ts' in c.lower() or 'time' in c.lower()]
print(f"⏰ Timestamp columns found: {ts_candidates}\n")

for col in ts_candidates:
    print(f"📊 Column: {col}")
    print("-" * 70)
    
    # Sample values
    print("First 5 values:")
    for i, val in enumerate(df[col].head(5), 1):
        print(f"  {i}. {val}")
    
    print("\nLast 5 values:")
    for i, val in enumerate(df[col].tail(5), 1):
        print(f"  {i}. {val}")
    
    # Check if numeric
    try:
        numeric_vals = pd.to_numeric(df[col], errors='coerce')
        numeric_count = numeric_vals.notna().sum()
        print(f"\n📈 Numeric values: {numeric_count}/{len(df)}")
        
        if numeric_count > 0:
            sample = numeric_vals.dropna().iloc[0]
            print(f"   Sample value: {sample}")
            print(f"   Magnitude: {sample:.2e}")
            
            # Detect unit
            if sample > 1e18:
                unit = "nanoseconds"
                test_unit = "ns"
            elif sample > 1e15:
                unit = "microseconds"
                test_unit = "us"
            elif sample > 1e12:
                unit = "milliseconds"
                test_unit = "ms"
            elif sample > 1e9:
                unit = "seconds (Unix timestamp)"
                test_unit = "s"
            else:
                unit = "unknown/too small"
                test_unit = "s"
            
            print(f"   Likely unit: {unit}")
            
            # Try parsing
            try:
                parsed = pd.to_datetime(sample, unit=test_unit, utc=True)
                print(f"   ✅ Parsed as {test_unit}: {parsed}")
            except Exception as e:
                print(f"   ❌ Parse failed: {e}")
    
    except Exception as e:
        print(f"   ⚠️  Cannot convert to numeric: {e}")
    
    print("\n" + "=" * 70 + "\n")

# Show full first row
print("📄 First complete row:")
print("-" * 70)
print(df.iloc[0].to_dict())

print("\n" + "=" * 70)
print("💡 NEXT STEPS:")
print("=" * 70)
print("""
1. Check the timestamp format above
2. If timestamps are numeric (Unix time), we need to fix clean_sensor_csv.py
3. If timestamps are already wrong in raw CSV, we need to check data source
""")