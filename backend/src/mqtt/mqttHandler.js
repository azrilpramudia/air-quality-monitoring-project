import mqttClient from "./mqttClient.js";
import { broadcastWS } from "../websocket/wsServer.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/* =====================================================
   CONFIG
===================================================== */

// Minimal interval simpan ke DB per device (ms)
const MIN_INSERT_INTERVAL = 60_000; // 1 menit

// Threshold perubahan minimal agar data dianggap penting
const DELTA = {
  temperature: 0.2, // °C
  humidity: 1.0, // %
  tvoc: 20, // ppb
  eco2: 30, // ppm
  dust: 10, // ug/m3
};

/* =====================================================
   HELPERS
===================================================== */

// Pastikan number valid
const safeNum = (v) => (typeof v === "number" && !isNaN(v) ? v : null);

// Validasi range fisik
const clamp = (v, min, max) => {
  if (typeof v !== "number") return null;
  if (v < min || v > max) return null;
  return v;
};

// ESP32 kirim ts dalam detik → Date (ms)
function safeTimestamp(ts) {
  const n = Number(ts);
  if (!n || isNaN(n)) return null;
  return new Date(n * 1000);
}

// Cek apakah ada perubahan signifikan
function hasSignificantChange(curr, last) {
  if (!last) return true;

  return (
    Math.abs(curr.temperature - last.temperature) > DELTA.temperature ||
    Math.abs(curr.humidity - last.humidity) > DELTA.humidity ||
    Math.abs(curr.tvoc - last.tvoc) > DELTA.tvoc ||
    Math.abs(curr.eco2 - last.eco2) > DELTA.eco2 ||
    Math.abs(curr.dust - last.dust) > DELTA.dust
  );
}

/* =====================================================
   MQTT EVENTS
===================================================== */

mqttClient.on("connect", () => {
  console.log("📡 MQTT Connected");
});

mqttClient.on("message", async (topic, message, packet) => {
  try {
    // 🚫 Abaikan retained / ghost message
    if (packet?.retain) return;

    // 1️⃣ Parse JSON
    let data;
    try {
      data = JSON.parse(message.toString());
    } catch {
      console.error("❌ Invalid JSON from MQTT");
      return;
    }

    console.log("📥 Incoming MQTT:", data);

    // 2️⃣ Validasi timestamp sensor
    const sensorTs = safeTimestamp(data.ts);
    if (!sensorTs) return;

    // 3️⃣ Validasi & sanitasi nilai sensor
    const cleaned = {
      deviceId: data.device_id ?? "unknown",

      temperature: clamp(safeNum(data.temp_c), -10, 60),
      humidity: clamp(safeNum(data.rh_pct), 0, 100),
      tvoc: clamp(safeNum(data.tvoc_ppb), 0, 2000),
      eco2: clamp(safeNum(data.eco2_ppm), 350, 5000),
      dust: clamp(safeNum(data.dust_ugm3), 0, 3000),

      aqi: clamp(safeNum(data.aqi), 1, 5),
    };

    // Jika ada data penting yang invalid → drop
    if (
      cleaned.temperature === null ||
      cleaned.humidity === null ||
      cleaned.tvoc === null ||
      cleaned.eco2 === null ||
      cleaned.dust === null
    ) {
      console.log("⚠️ Dropped invalid sensor data");
      return;
    }

    console.log("🔄 Normalized:", {
      ...cleaned,
      ts: sensorTs,
    });

    /* =================================================
       🔔 REALTIME STREAM (ALWAYS)
       UI / Dashboard harus selalu update
    ================================================== */

    broadcastWS({
      type: "sensor_update",
      data: {
        ...cleaned,
        ts: sensorTs,
      },
    });

    console.log("📤 WebSocket broadcast sent");

    /* =================================================
       🧊 DATABASE FILTERING (STRICT)
       DB boleh ketat, UI tidak
    ================================================== */

    // Ambil data terakhir device ini
    const last = await prisma.actual.findFirst({
      where: { deviceId: cleaned.deviceId },
      orderBy: { ts: "desc" },
    });

    // 4️⃣ Rate limit (hindari overload DB)
    if (last && sensorTs - last.ts < MIN_INSERT_INTERVAL) {
      console.log("⏱️ DB skip: rate limit");
      return;
    }

    // 5️⃣ Delta filter (hindari data stagnan)
    if (last && !hasSignificantChange(cleaned, last)) {
      console.log("📉 DB skip: no significant change");
      return;
    }

    // 6️⃣ Simpan ke database
    await prisma.actual.create({
      data: {
        ts: sensorTs, // waktu sensor
        createdAt: new Date(), // waktu server
        ...cleaned,
      },
    });

    console.log("💾 Saved to DB:", cleaned.deviceId, sensorTs.toISOString());
  } catch (err) {
    console.error("❌ MQTT Handler Error:", err);
  }
});
