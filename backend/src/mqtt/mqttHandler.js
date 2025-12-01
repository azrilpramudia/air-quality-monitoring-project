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

    // ============================
    // 1. Validasi JSON MQTT
    // ============================
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      console.error("❌ Invalid JSON from MQTT:", raw);
      return;
    }

    // Log input
    console.log("📥 Incoming MQTT:", data);

    // ============================
    // 2. Mapping Data
    // ============================
    const mapped = {
      temperature: safeNum(data.temp_c),
      humidity: safeNum(data.rh_pct),
      tvoc: safeNum(data.tvoc_ppb),
      eco2: safeNum(data.eco2_ppm),
      dust: safeNum(data.dust_ugm3),
      aqi: safeNum(data.aqi),
      createdAt: safeTimestamp(data.ts), // pakai timestamp device
      deviceId: data.device_id ?? "unknown",
    };

    // Optional: log cleaned data
    console.log("🔄 Normalized:", mapped);

    // ============================
    // 3. Prevent duplikasi data
    // (Jika device spam data dalam 1 detik)
    // ============================
    const last = await prisma.sensorData.findFirst({
      orderBy: { id: "desc" },
    });

    if (last && Math.abs(mapped.createdAt - last.createdAt) < 1000) {
      console.log("⏩ Skipped duplicate sensor data (within same second)");
    } else {
      // ============================
      // 4. Simpan ke Database
      // ============================
      await prisma.sensorData.create({
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

      console.log("💾 Saved to database at", mapped.createdAt);
    }

    // ============================
    // 5. Broadcast ke WebSocket
    // ============================
    broadcastWS({
      type: "sensor_update",
      data: mapped,
    });

    console.log("📤 WebSocket broadcast complete\n");
  } catch (err) {
    console.error("❌ MQTT Handler Error:", err);
  }
});
