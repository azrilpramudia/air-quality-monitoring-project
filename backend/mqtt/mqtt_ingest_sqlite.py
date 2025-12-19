import os
import json
import time
import sqlite3
import threading
import paho.mqtt.client as mqtt

# ======================================================
# MQTT CONFIG
# ======================================================
BROKER = "broker.emqx.io"
PORT = 1883
TOPIC_IN = "uninus/iot/air_quality/esp32-01"
CLIENT_ID = "pc-ingest-sqlite"

# ======================================================
# SQLITE CONFIG
# ======================================================
DB_PATH = "data/sensor.db"
os.makedirs("data", exist_ok=True)

con = sqlite3.connect(DB_PATH, check_same_thread=False)
cur = con.cursor()

# Enable WAL mode (safe concurrent read/write)
cur.execute("PRAGMA journal_mode=WAL;")
con.commit()

db_lock = threading.Lock()

# ======================================================
# DB SCHEMA
# ======================================================
cur.execute("""
CREATE TABLE IF NOT EXISTS sensor (
    ts INTEGER NOT NULL,
    device_id TEXT,
    temp_c REAL,
    rh_pct REAL,
    tvoc_ppb REAL,
    eco2_ppm REAL,
    dust_ugm3 REAL
);
""")

# Unique index (anti duplicate)
cur.execute("""
CREATE UNIQUE INDEX IF NOT EXISTS uniq_ts_dev
ON sensor (ts, device_id);
""")
con.commit()

# ======================================================
# SQL INSERT
# ======================================================
SQL_INSERT = """
INSERT OR IGNORE INTO sensor
(ts, device_id, temp_c, rh_pct, tvoc_ppb, eco2_ppm, dust_ugm3)
VALUES (?, ?, ?, ?, ?, ?, ?)
"""

print("✅ SQLite ready:", DB_PATH)

# ======================================================
# MQTT CALLBACKS
# ======================================================
def on_connect(client, userdata, flags, reason_code, properties):
    print("📡 MQTT connected:", reason_code)
    client.subscribe(TOPIC_IN)
    print("📥 Listening topic:", TOPIC_IN)

def on_message(client, userdata, msg):
    try:
        raw = msg.payload.decode("utf-8", errors="ignore").strip()

        # Skip non-JSON
        if not raw.startswith("{"):
            print("⚠️ Skipped non-JSON payload")
            return

        d = json.loads(raw)

        # Timestamp normalize
        ts = int(d.get("ts", time.time()))
        if ts > 1e12:   # milliseconds → seconds
            ts //= 1000

        row = (
            ts,
            d.get("device_id", "esp32"),
            d.get("temp_c"),
            d.get("rh_pct"),
            d.get("tvoc_ppb"),
            d.get("eco2_ppm"),
            d.get("dust_ugm3"),
        )

        with db_lock:
            cur.execute(SQL_INSERT, row)
            con.commit()

        print("✅ Inserted:", row)

    except Exception as e:
        print("❌ ingest error:", e)

# ======================================================
# MAIN
# ======================================================
def main():
    client = mqtt.Client(
        mqtt.CallbackAPIVersion.VERSION2,
        client_id=CLIENT_ID
    )

    client.on_connect = on_connect
    client.on_message = on_message

    client.reconnect_delay_set(min_delay=1, max_delay=10)

    print(f"🔌 Connecting to MQTT {BROKER}:{PORT} ...")
    client.connect(BROKER, PORT, keepalive=60)
    client.loop_forever()

# ======================================================
if __name__ == "__main__":
    try:
        main()
    finally:
        con.commit()
        con.close()
        print("🛑 SQLite closed")
