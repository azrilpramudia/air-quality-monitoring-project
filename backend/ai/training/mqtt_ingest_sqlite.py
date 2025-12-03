# mqtt_ingest_sqlite.py — MQTT → SQLite (REALTIME COMMIT + WAL MODE)
import os, json, sqlite3, time, socket
import paho.mqtt.client as mqtt

# ===== Broker list =====
BROKERS = [
    ("broker.emqx.io", 1883),
]

TOPIC_IN = "jlksafkjdsalkcjalkdsfljahahjoiqjwoiejiwqueoiwqueiwfhkjbj217482140173498309ureckjdbcbdsajfb"
DB_PATH  = "data/sensor.db"

# ===== SQLite setup =====
os.makedirs("data", exist_ok=True)
con = sqlite3.connect(DB_PATH, check_same_thread=False)
cur = con.cursor()

# ---- ENABLE WAL (supaya DB bisa dibaca saat ingest jalan) ----
cur.execute("PRAGMA journal_mode=WAL;")
con.commit()

TARGET_COLS = [
    ("ts", "INTEGER NOT NULL"),
    ("device_id", "TEXT"),
    ("temp_c", "REAL"),
    ("rh_pct", "REAL"),
    ("tvoc_ppb", "REAL"),
    ("eco2_ppm", "REAL"),
    ("dust_ugm3", "REAL"),
]

def table_exists(name="sensor"):
    row = cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (name,)).fetchone()
    return row is not None

def get_db_cols():
    return [r[1] for r in cur.execute("PRAGMA table_info(sensor)").fetchall()]

# Create table if needed
if not table_exists("sensor"):
    cur.execute("""
    CREATE TABLE sensor (
      ts INTEGER NOT NULL,
      device_id TEXT,
      temp_c REAL,
      rh_pct REAL,
      tvoc_ppb REAL,
      eco2_ppm REAL,
      dust_ugm3 REAL
    );
    """)
    con.commit()

# Add missing columns
db_cols = get_db_cols()
for name, coltype in TARGET_COLS:
    if name not in db_cols:
        cur.execute(f"ALTER TABLE sensor ADD COLUMN {name} {coltype}")
        con.commit()
db_cols = get_db_cols()

# Unique index
have_index = cur.execute(
    "SELECT name FROM sqlite_master WHERE type='index' AND name='uniq_ts_dev'"
).fetchone() is not None

if not have_index:
    try:
        cur.execute("CREATE UNIQUE INDEX IF NOT EXISTS uniq_ts_dev ON sensor(ts, device_id)")
        con.commit()
    except:
        pass

INSERT_ORDER = [name for name, _ in TARGET_COLS if name in db_cols]
PLACE = ",".join(["?"] * len(INSERT_ORDER))
SQL = f"INSERT OR IGNORE INTO sensor ({','.join(INSERT_ORDER)}) VALUES ({PLACE})"

print("DB_COLS:", db_cols)
print("INSERT_ORDER:", INSERT_ORDER)


# =============================
# MQTT HANDLERS
# =============================
def on_connect(client, userdata, flags, reason_code, properties=None):
    print("connected:", reason_code, "| listening:", TOPIC_IN)
    client.subscribe(TOPIC_IN)


def on_message(client, userdata, msg):
    try:
        d = json.loads(msg.payload.decode("utf-8"))

        row_map = {
            "ts": int(d.get("ts", time.time())),
            "device_id": d.get("device_id", "esp32"),
            "temp_c": d.get("temp_c"),
            "rh_pct": d.get("rh_pct"),
            "tvoc_ppb": d.get("tvoc_ppb"),
            "eco2_ppm": d.get("eco2_ppm"),
            "dust_ugm3": d.get("dust_ugm3"),
        }

        vals = [row_map.get(k) for k in INSERT_ORDER]
        cur.execute(SQL, vals)

        # ---- REALTIME COMMIT ----
        con.commit()

    except Exception as e:
        print("ingest error:", e)


def main():
    cli = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id="pc-ingest-sqlite")
    cli.on_connect = on_connect
    cli.on_message = on_message

    while True:
        for host, port in BROKERS:
            try:
                print(f"trying broker: {host}:{port} ...")
                cli.connect(host, port, keepalive=60)
                print(f"connected to {host}:{port}")
                cli.loop_forever()

            except Exception as e:
                print("connect error:", e)
                time.sleep(3)

if __name__ == "__main__":
    try:
        main()
    finally:
        con.commit()
        con.close()
