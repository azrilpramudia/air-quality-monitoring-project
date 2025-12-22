#!/usr/bin/env python3
"""
Import sensor_clean.csv into Prisma DB (SAFE)
- Robust timestamp parsing
- Skip duplicates (deviceId + ts)
- Batch insert
"""

from __future__ import annotations
import os
import sys
import pandas as pd
from datetime import datetime
from sqlalchemy import create_engine, text

# ======================================================
# CONFIG
# ======================================================

CSV_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "data", "sensor_clean.csv")
)

DEVICE_ID = "esp32-01-client-io"
BATCH_SIZE = 500

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "mysql+pymysql://root:root123@localhost:3306/db_monitor",
)

# ======================================================
# HELPERS
# ======================================================

def parse_ts(series: pd.Series) -> pd.Series:
    """Robust timestamp parser (sec / ms / us / ns / string)"""
    s = series.astype(str).str.strip()
    num = pd.to_numeric(s, errors="coerce")

    if num.notna().sum() > 0:
        sample = num.dropna().iloc[0]
        if sample > 1e18:
            unit = "ns"
        elif sample > 1e15:
            unit = "us"
        elif sample > 1e12:
            unit = "ms"
        else:
            unit = "s"

        print(f"🕒 Parsing ts as numeric ({unit})")
        return pd.to_datetime(num, unit=unit, utc=True)

    print("🕒 Parsing ts as datetime string")
    return pd.to_datetime(s, utc=True, errors="coerce")


# ======================================================
# MAIN
# ======================================================

def main():
    if not os.path.exists(CSV_PATH):
        print(f"❌ CSV not found: {CSV_PATH}")
        sys.exit(1)

    print(f"📥 Loading CSV: {CSV_PATH}")
    df = pd.read_csv(CSV_PATH)
    print(f"✅ Rows loaded: {len(df)}")

    # Validate columns
    required = ["ts", "temp_c", "rh_pct", "tvoc_ppb", "eco2_ppm", "dust_ugm3"]
    for c in required:
        if c not in df.columns:
            raise RuntimeError(f"Missing column: {c}")

    # Parse timestamp
    df["ts"] = parse_ts(df["ts"])
    df = df.dropna(subset=["ts"])
    df = df.sort_values("ts")

    print(f"⏱️ Time range: {df['ts'].min()} → {df['ts'].max()}")

    # Map to DB schema
    df_db = pd.DataFrame({
        "deviceId": DEVICE_ID,
        "ts": df["ts"],
        "temperature": df["temp_c"].astype(float),
        "humidity": df["rh_pct"].astype(float),
        "tvoc": df["tvoc_ppb"].astype(int),
        "eco2": df["eco2_ppm"].astype(int),
        "dust": df["dust_ugm3"].astype(float),
        "aqi": None,
        "createdAt": df["ts"],
    })

    engine = create_engine(DATABASE_URL)

    inserted = 0

    with engine.begin() as conn:
        print("🔎 Checking existing records...")

        existing = conn.execute(
            text("""
                SELECT ts FROM Actual
                WHERE deviceId = :deviceId
            """),
            {"deviceId": DEVICE_ID},
        ).fetchall()

        existing_ts = {row[0] for row in existing}
        before = len(df_db)

        df_db = df_db[~df_db["ts"].isin(existing_ts)]
        skipped = before - len(df_db)

        print(f"⏭️ Skipped duplicates: {skipped}")
        print(f"💾 Rows to insert: {len(df_db)}")

        if df_db.empty:
            print("✅ Nothing to insert")
            return

        # Batch insert
        for i in range(0, len(df_db), BATCH_SIZE):
            batch = df_db.iloc[i:i + BATCH_SIZE]
            batch.to_sql(
                "Actual",
                conn,
                if_exists="append",
                index=False,
            )
            inserted += len(batch)
            print(f"   ➕ Inserted {inserted} rows")

    print("===================================================")
    print(f"✅ IMPORT COMPLETED")
    print(f"   Inserted : {inserted}")
    print(f"   Skipped  : {skipped}")
    print("===================================================")


if __name__ == "__main__":
    main()
