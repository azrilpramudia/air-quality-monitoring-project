import mqttClient from "./mqttClient.js";
import { broadcastWS } from "../websocket/wsServer.js";

const safeNum = (v) => (typeof v === "number" && !isNaN(v) ? v : 0);

mqttClient.on("message", async (topic, message) => {
  try {
    const raw = message.toString();

    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      console.error("❌ Invalid JSON:", raw);
      return;
    }

    console.log("📥 Incoming data:", data);

    const mapped = {
      temperature: data.temp_c ?? 0,
      humidity: data.rh_pct ?? 0,
      tvoc: data.tvoc_ppb ?? 0,
      eco2: data.eco2_ppm ?? 0,
      dust: data.dust_ugm3 ?? 0,
      aqi: data.aqi ?? 0,
      timestamp: data.ts,
    };

    console.log("📤 Broadcasting:", mapped);

    broadcastWS({
      type: "sensor_update",
      data: mapped,
    });
  } catch (err) {
    console.error("❌ MQTT Message Error:", err);
  }
});
