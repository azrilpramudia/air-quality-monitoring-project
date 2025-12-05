import mqttClient from "./mqttClient.js";
import { broadcastWS } from "../websocket/wsServer.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Helper: convert only if number valid
const safeNum = (v) => (typeof v === "number" && !isNaN(v) ? v : 0);

// Helper: validate timestamp from device
function safeTimestamp(ts) {
  if (!ts) return new Date();

  const n = Number(ts);
  if (isNaN(n)) return new Date();

  const d = new Date(n);
  if (d.toString() === "Invalid Date") return new Date();

  return d;
}

mqttClient.on("connect", () => {
  console.log("📡 MQTT Connected!");
});

mqttClient.on("message", async (topic, message) => {
  try {
    const raw = message.toString();

    // 1. Parse JSON
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      console.error("❌ Invalid JSON from MQTT:", raw);
      return;
    }

    console.log("📥 Incoming MQTT:", data);

    // 2. Mapping sensor values
    const mapped = {
      temperature: safeNum(data.temp_c),
      humidity: safeNum(data.rh_pct),
      tvoc: safeNum(data.tvoc_ppb),
      eco2: safeNum(data.eco2_ppm),
      dust: safeNum(data.dust_ugm3),
      aqi: safeNum(data.aqi),
      createdAt: safeTimestamp(data.ts),
      deviceId: data.device_id ?? "unknown",
    };

    console.log("🔄 Normalized:", mapped);

    // 3. Prevent duplicate readings (within 1 sec)
    const last = await prisma.sensordata.findFirst({
      orderBy: { id: "desc" },
    });

    if (last && Math.abs(mapped.createdAt - last.createdAt) < 1000) {
      console.log("⏩ Skipped duplicate sensor data");
    } else {
      // 4. Save to database
      await prisma.sensordata.create({
        data: {
          temperature: mapped.temperature,
          humidity: mapped.humidity,
          tvoc: mapped.tvoc,
          eco2: mapped.eco2,
          dust: mapped.dust,
          aqi: mapped.aqi,
          createdAt: mapped.createdAt,
        },
      });

      console.log("💾 Saved to DB at:", mapped.createdAt);
    }

    // 5. WebSocket broadcast
    broadcastWS({
      type: "sensor_update",
      data: mapped,
    });

    console.log("📤 WebSocket broadcast complete\n");
  } catch (err) {
    console.error("❌ MQTT Handler Error:", err);
  }
});
