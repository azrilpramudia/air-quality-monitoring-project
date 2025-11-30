import mqttClient from "./mqttClient.js";
import { broadcastWS } from "../websocket/wsServer.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const safeNum = (v) => (typeof v === "number" && !isNaN(v) ? v : 0);

mqttClient.on("message", async (topic, message) => {
  try {
    const raw = message.toString();

    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      console.error("❌ Invalid JSON from MQTT:", raw);
      return;
    }

    console.log("📥 Incoming data:", data);

    const mapped = {
      temperature: safeNum(data.temp_c),
      humidity: safeNum(data.rh_pct),
      tvoc: safeNum(data.tvoc_ppb),
      eco2: safeNum(data.eco2_ppm),
      dust: safeNum(data.dust_ugm3),
      aqi: safeNum(data.aqi),
      device_id: data.device_id ?? "unknown",
      timestamp: data.ts ?? Date.now(),
    };

    console.log("📤 Broadcasting to WebSocket:", mapped);

    // --- SAVE TO DATABASE ---
    await prisma.sensorData.create({
      data: {
        temperature: mapped.temperature,
        humidity: mapped.humidity,
        tvoc: mapped.tvoc,
        eco2: mapped.eco2,
        dust: mapped.dust,
        aqi: mapped.aqi,
      },
    });

    console.log("💾 Saved to SensorData DB");

    // --- BROADCAST ---
    broadcastWS({
      type: "sensor_update",
      data: mapped,
    });
  } catch (err) {
    console.error("❌ MQTT Handler Error:", err);
  }
});
