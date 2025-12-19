import pandas as pd
from sqlalchemy import text

def load_actual_from_db(db, device_id: str, hours: int = 24):
    query = text("""
        SELECT
            UNIX_TIMESTAMP(createdAt) AS ts,
            temperature AS temp_c,
            humidity AS rh_pct,
            tvoc,
            eco2,
            dust
        FROM Actual
        WHERE deviceId = :device_id
        ORDER BY createdAt DESC
        LIMIT :limit
    """)

    limit = hours * 60  # asumsi 1 menit sekali
    rows = db.execute(query, {
        "device_id": device_id,
        "limit": limit
    }).fetchall()

    if not rows:
        return None

    df = pd.DataFrame(rows, columns=[
        "ts", "temp_c", "rh_pct", "tvoc_ppb", "eco2_ppm", "dust_ugm3"
    ])

    df["ts"] = pd.to_datetime(df["ts"], unit="s", utc=True)
    df = df.sort_values("ts").set_index("ts")

    return df
