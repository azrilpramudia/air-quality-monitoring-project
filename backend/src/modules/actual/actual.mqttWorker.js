// src/modules/actual/actual.mqttWorker.js
import mqttClient from "../../mqtt/mqttClient.js";
import { saveActualData, getLatestActualData } from "./actual.repository.js";
import { broadcastWS } from "../../websocket/wsServer.js";

// ========================================
// HELPERS
// ========================================

const safeNum = (v) =>
  typeof v === "number"
    ? v
    : typeof v === "string" && v.trim() !== ""
    ? Number(v)
    : NaN;

const isValid = (v) => typeof v === "number" && !isNaN(v);

// Insert interval protection
const MIN_INTERVAL = 10_000; // 10 seconds

// Sensor bounds (sanity check)
const BOUNDS = {
  temperature: [-10, 60],
  humidity: [0, 100],
  tvoc: [0, 10000],
  eco2: [0, 10000],
  dust: [0, 1000],
};

// ========================================
// MQTT WORKER
// ========================================

export function initActualMQTTWorker() {
  console.log("📡 Actual MQTT worker initialized");

  mqttClient.on("message", async (_topic, msg) => {
    try {
      // -----------------------------
      // 1️⃣ Parse JSON
      // -----------------------------
      let payload;
      try {
        payload = JSON.parse(msg.toString());
      } catch {
        console.error("❌ [ACTUAL] Invalid JSON");
        return;
      }

      if (!payload.device_id || !payload.ts) {
        console.warn("⚠️ [ACTUAL] Missing device_id or ts");
        return;
      }

      // -----------------------------
      // 2️⃣ Normalize payload
      // -----------------------------
      const actual = {
        deviceId: payload.device_id,
        ts: new Date(Number(payload.ts) * 1000), // sensor timestamp
        temperature: safeNum(payload.temp_c),
        humidity: safeNum(payload.rh_pct),
        tvoc: safeNum(payload.tvoc_ppb),
        eco2: safeNum(payload.eco2_ppm),
        dust: safeNum(payload.dust_ugm3),
        aqi: safeNum(payload.aqi),
        createdAt: new Date(),
      };

      // -----------------------------
      // 3️⃣ Sanity validation
      // -----------------------------
      for (const key in BOUNDS) {
        const [min, max] = BOUNDS[key];
        const val = actual[key];

        if (!isValid(val) || val < min || val > max) {
          console.warn(`⚠️ [ACTUAL] Dropped invalid ${key}:`, val);
          return;
        }
      }

      // -----------------------------
      // 4️⃣ Anti-overload filter
      // -----------------------------
      const last = await getLatestActualData(actual.deviceId);

      if (last) {
        const diff = actual.createdAt - last.createdAt;
        if (diff < MIN_INTERVAL) {
          console.log("⏩ [ACTUAL] Skipped (too frequent)");
          return;
        }
      }

      // -----------------------------
      // 5️⃣ Save to DB
      // -----------------------------
      const saved = await saveActualData(actual);

      console.log(
        `💾 [ACTUAL] Saved | device=${
          saved.deviceId
        } | ts=${saved.ts.toISOString()}`
      );

      // -----------------------------
      // 6️⃣ WebSocket broadcast
      // -----------------------------
      broadcastWS({
        type: "actual_update",
        data: saved,
      });
    } catch (err) {
      console.error("❌ [ACTUAL] Worker error:", err.message);
      console.error(err.stack);
    }
  });
}
