import mqttClient from "../../mqtt/mqttClient.js";
import { broadcastWS } from "../../websocket/wsServer.js";

export function initRealtimeMQTTWorker() {
  console.log("⚡ Realtime MQTT worker initialized");

  mqttClient.on("message", (_topic, msg, packet) => {
    if (packet?.retain) return;

    let payload;
    try {
      payload = JSON.parse(msg.toString());
    } catch {
      return;
    }

    if (!payload.device_id || !payload.ts) return;

    const realtime = {
      deviceId: payload.device_id,
      temperature: Number(payload.temp_c),
      humidity: Number(payload.rh_pct),
      tvoc: Number(payload.tvoc_ppb),
      eco2: Number(payload.eco2_ppm),
      dust: Number(payload.dust_ugm3),
      aqi: Number(payload.aqi),
      ts: new Date(Number(payload.ts) * 1000),
    };

    // 🔥 INI PENTING
    broadcastWS({
      type: "sensor_update",
      data: realtime,
    });
  });
}
