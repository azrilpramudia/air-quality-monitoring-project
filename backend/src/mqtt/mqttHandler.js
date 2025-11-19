import mqttClient from "./mqttClient.js";
import prisma from "../config/prisma.js";
import { broadcastWS } from "../websocket/wsServer.js";

mqttClient.on("message", async (topic, message) => {
  try {
    const data = JSON.parse(message.toString());

    console.log("📥 Incoming data:", data);

    // Map ESP32 → Prisma schema
    const mapped = {
      temperature: data.temp_c,
      humidity: data.rh_pct,
      tvoc: data.tvoc_ppb,
      eco2: data.eco2_ppm,
      dust: data.dust_ugm3 || 0
    };

    await prisma.sensorData.create({ data: mapped });

    console.log("💾 Saved to DB:", mapped);

    // Broadcast
    broadcastWS({ event: "new_data", payload: mapped });

  } catch (err) {
    console.error("❌ MQTT Message Error:", err);
  }
});
