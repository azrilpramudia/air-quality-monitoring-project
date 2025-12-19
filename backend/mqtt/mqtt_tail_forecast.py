# mqtt_tail_forecast.py — tail paket batch forecast [WIB print]
import json
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
import paho.mqtt.client as mqtt

BROKER = "broker.emqx.io"
TOPIC  = "uninus/iot/air_quality/esp32-01"
WIB = ZoneInfo("Asia/Jakarta")

def to_wib(ts_epoch):
    return datetime.fromtimestamp(int(ts_epoch), timezone.utc).astimezone(WIB).strftime("%Y-%m-%d %H:%M:%S%z")

def on_connect(client, userdata, flags, rc, properties=None):
    print("listening:", TOPIC)
    client.subscribe(TOPIC, qos=0)

def on_message(client, userdata, msg):
    try:
        d = json.loads(msg.payload.decode("utf-8"))
        if "forecast" in d and isinstance(d["forecast"], list):
            print(f"received batch: items={len(d['forecast'])}, freq={d.get('freq')}")
            for it in d["forecast"][:24]:
                ts_wib = to_wib(it.get("ts"))
                print({**it, "ts_wib": ts_wib})
        else:
            print(d)
    except Exception as e:
        print("decode error:", e)

def main():
    cli = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id="pc-tail-forecast")
    cli.on_connect = on_connect
    cli.on_message = on_message
    cli.connect(BROKER, 1883, keepalive=60)
    cli.loop_forever()

if __name__ == "__main__":
    main()
