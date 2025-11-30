import json
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
import paho.mqtt.client as mqtt

TOPIC = "jlksafkjdsalkcjalkdsfljahahjoiqjwoiejiwqueoiwqueiwfhkjbj217482140173498309ureckjdbcbdsajfb"
WIB = ZoneInfo("Asia/Jakarta")

def on_connect(c, u, f, rc, p=None):
    print("listening:", TOPIC)
    c.subscribe(TOPIC, qos=0)

def on_message(c, u, m):
    try:
        s = m.payload.decode("utf-8")
        d = json.loads(s)
        if "ts" in d:
            ts_wib = datetime.fromtimestamp(int(d["ts"]), timezone.utc).astimezone(WIB).strftime("%Y-%m-%d %H:%M:%S%z")
            print(f"ts(WIB)={ts_wib} | {s}")
        else:
            print(s)
    except Exception:
        print("malformed")

cli = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id="pc-tail-sensor")
cli.on_connect = on_connect
cli.on_message = on_message
cli.connect("broker.emqx.io", 1883, 60)
cli.loop_forever()
