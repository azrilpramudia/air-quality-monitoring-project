import mqttClient from "./mqttClient.js";
import prisma from "../config/prisma.js";
import { broadcastWS } from "../websocket/wsServer.js";

mqttClient.on("message", async (topic, message) => {
  try {
    const data = JSON.parse(message.toString());

    console.log("📥 Incoming data:", data);

    const mapped = {
      temperature: data.temp_c ?? 0,
      humidity: data.rh_pct ?? 0,
      tvoc: data.tvoc_ppb ?? 0,
      eco2: data.eco2_ppm ?? 0,
      dust: data.dust_ugm3 ?? 0,
    };

    await prisma.sensorData.create({ data: mapped });
    console.log("💾 Saved to DB:", mapped);

    broadcastWS({
      type: "sensor_update",
      data: mapped,
    });
  } catch (err) {
    console.error("❌ MQTT Message Error:", err);
  }
});
