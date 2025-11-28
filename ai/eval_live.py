# eval_live.py — evaluasi live TEMP & TVOC (tanpa dust) [WIB print]
import json, os, csv
from collections import deque
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
import paho.mqtt.client as mqtt

BROKER     = "broker.emqx.io"
PORT       = 1883
TOPIC_IN   = "jlksafkjdsalkcjalkdsfljahahjoiqjwoiejiwqueoiwqueiwfhkjbj217482140173498309ureckjdbcbdsajfb"     # aktual dari ESP32
TOPIC_OUT  = "iot/ruang1/forecast"   # prediksi dari PC
OUT_CSV    = "data/eval_live.csv"

WIB = ZoneInfo("Asia/Jakarta")

pred_q   = deque(maxlen=2000)
actual_q = deque(maxlen=2000)

os.makedirs("data", exist_ok=True)
if not os.path.exists(OUT_CSV):
    with open(OUT_CSV, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow([
            "ts_actual","ts_pred","horizon_min",
            "temp_c","temp_c_pred","tvoc_ppb","tvoc_ppb_pred",
            "e_temp","e_tvoc"
        ])

def _fmt_wib(epoch_s: int) -> str:
    return datetime.fromtimestamp(epoch_s, timezone.utc).astimezone(WIB).strftime("%Y-%m-%d %H:%M:%S%z")

def on_connect(client, userdata, flags, reason_code, properties=None):
    print("connected:", reason_code)
    client.subscribe([(TOPIC_IN, 0), (TOPIC_OUT, 0)])
    print("listening:", TOPIC_IN, "and", TOPIC_OUT)

def try_match_and_log():
    if not pred_q or not actual_q:
        return

    pred_by_ts = {p["ts_pred"]: p for p in list(pred_q)}
    logged = 0

    for a in list(actual_q):
        ts = a["ts"]
        if ts in pred_by_ts:
            p = pred_by_ts[ts]

            e_temp = a["temp_c"] - p["temp_c_pred"]
            e_tvoc = a["tvoc_ppb"] - p["tvoc_ppb_pred"]

            with open(OUT_CSV, "a", newline="") as f:
                w = csv.writer(f)
                w.writerow([
                    a["ts"], p["ts_pred"], p["horizon_min"],
                    a["temp_c"], p["temp_c_pred"], a["tvoc_ppb"], p["tvoc_ppb_pred"],
                    e_temp, e_tvoc
                ])

            print(
                f"[EVAL] ts(WIB)={_fmt_wib(ts)} | "
                f"T: act={a['temp_c']:.3f} pred={p['temp_c_pred']:.3f} err={e_temp:.3f}  ||  "
                f"TVOC: act={a['tvoc_ppb']:.3f} pred={p['tvoc_ppb_pred']:.3f} err={e_tvoc:.3f}"
            )

            pred_q.remove(p)
            actual_q.remove(a)
            logged += 1

    if logged:
        print(f"[EVAL] logged {logged} rows → {OUT_CSV}")

def on_message(client, userdata, msg):
    try:
        d = json.loads(msg.payload.decode("utf-8"))

        if msg.topic == TOPIC_OUT and "ts_pred" in d:
            pred_q.append({
                "ts_pred": int(d["ts_pred"]),
                "horizon_min": int(d.get("horizon_min", 0)),
                "temp_c_pred": float(d["temp_c_pred"]),
                "tvoc_ppb_pred": float(d["tvoc_ppb_pred"]),
            })

        elif msg.topic == TOPIC_IN and "ts" in d:
            actual_q.append({
                "ts": int(d["ts"]),
                "temp_c": float(d.get("temp_c", "nan")),
                "tvoc_ppb": float(d.get("tvoc_ppb", "nan")),
            })

        try_match_and_log()

    except Exception as e:
        print("on_message error:", e)

def main():
    cli = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id="pc-eval-live")
    cli.on_connect = on_connect
    cli.on_message = on_message
    cli.connect(BROKER, PORT, keepalive=60)
    cli.loop_forever()

if __name__ == "__main__":
    main()
