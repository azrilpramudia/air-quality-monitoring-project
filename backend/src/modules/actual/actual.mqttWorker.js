// src/modules/actual/actual.mqttWorker.js
import mqttClient from "../../mqtt/mqttClient.js";
import { saveActualData, getLatestActualData } from "./actual.repository.js";
import { broadcastWS } from "../../websocket/wsServer.js";

// ================================
// CONFIG
// ================================

const SENSOR_MAX_AGE = 60_000; // 1 menit (anggap realtime)
const MIN_INTERVAL = 10_000; // 10 detik (anti spam)

// ================================
// HELPERS
// ================================

const safeNum = (v) =>
  typeof v === "number"
    ? v
    : typeof v === "string" && v.trim() !== ""
    ? Number(v)
    : NaN;

const isValid = (v) => typeof v === "number" && !isNaN(v);

// ================================
// WORKER
// ================================

export function initActualMQTTWorker() {
  console.log("📡 Actual MQTT worker initialized");

  mqttClient.on("message", async (_topic, msg, packet) => {
    try {
      // ------------------------------------
      // 0️⃣ DROP MQTT RETAINED MESSAGE
      // ------------------------------------
      if (packet?.retain) {
        console.log("⏭️ [ACTUAL] Retained message skipped");
        return;
      }

      // ------------------------------------
      // 1️⃣ Parse JSON
      // ------------------------------------
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

      // ------------------------------------
      // 2️⃣ Timestamp freshness check
      // ------------------------------------
      const sensorTs = new Date(Number(payload.ts) * 1000);
      const age = Date.now() - sensorTs.getTime();

      if (age > SENSOR_MAX_AGE) {
        console.log("⏭️ [ACTUAL] Stale sensor data skipped");
        return;
      }

      // ------------------------------------
      // 3️⃣ Normalize payload
      // ------------------------------------
      const actual = {
        deviceId: payload.device_id,
        ts: sensorTs,
        temperature: safeNum(payload.temp_c),
        humidity: safeNum(payload.rh_pct),
        tvoc: safeNum(payload.tvoc_ppb),
        eco2: safeNum(payload.eco2_ppm),
        dust: safeNum(payload.dust_ugm3),
        aqi: safeNum(payload.aqi),
        createdAt: new Date(),
      };

      // ------------------------------------
      // 4️⃣ Basic validation
      // ------------------------------------
      if (
        !isValid(actual.temperature) ||
        !isValid(actual.humidity) ||
        !isValid(actual.tvoc) ||
        !isValid(actual.eco2) ||
        !isValid(actual.dust)
      ) {
        console.warn("⚠️ [ACTUAL] Invalid sensor values");
        return;
      }

      // ------------------------------------
      // 5️⃣ Anti-spam interval
      // ------------------------------------
      const last = await getLatestActualData(actual.deviceId);

      if (last) {
        const diff = actual.createdAt - last.createdAt;
        if (diff < MIN_INTERVAL) {
          console.log("⏩ [ACTUAL] Skipped (too frequent)");
          return;
        }
      }

      // ------------------------------------
      // 6️⃣ Save to DB
      // ------------------------------------
      const saved = await saveActualData(actual);

      console.log(
        `💾 [ACTUAL] Saved | device=${
          saved.deviceId
        } | ts=${saved.ts.toISOString()}`
      );

      // ------------------------------------
      // 7️⃣ Broadcast
      // ------------------------------------
      broadcastWS({
        type: "actual_update",
        data: saved,
      });
    } catch (err) {
      console.error("❌ [ACTUAL] Worker error:", err.message);
    }
  });
}
