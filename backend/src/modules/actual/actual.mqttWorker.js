// src/modules/actual/actual.mqttWorker.js
import mqttClient from "../../mqtt/mqttClient.js";
import { saveActualData, getLatestActualData } from "./actual.repository.js";
import { broadcastWS } from "../../websocket/wsServer.js";

// ================================
// CONFIG
// ================================

// Realtime window
const SENSOR_MAX_AGE = 60_000; // 1 menit

// Anti-duplicate (timestamp)
const MIN_TS_DIFF = 30_000; // 30 detik (DEV)

// Change threshold (noise filter)
const CHANGE_THRESHOLD = {
  temperature: 0.2,
  humidity: 0.5,
  tvoc: 10,
  eco2: 20,
  dust: 1,
};

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

const hasSignificantChange = (curr, prev) => {
  return (
    Math.abs(curr.temperature - prev.temperature) >
      CHANGE_THRESHOLD.temperature ||
    Math.abs(curr.humidity - prev.humidity) > CHANGE_THRESHOLD.humidity ||
    Math.abs(curr.tvoc - prev.tvoc) > CHANGE_THRESHOLD.tvoc ||
    Math.abs(curr.eco2 - prev.eco2) > CHANGE_THRESHOLD.eco2 ||
    Math.abs(curr.dust - prev.dust) > CHANGE_THRESHOLD.dust
  );
};

// ================================
// WORKER
// ================================

export function initActualMQTTWorker() {
  console.log("📡 Actual MQTT worker initialized");

  mqttClient.on("message", async (_topic, msg, packet) => {
    try {
      // ------------------------------------
      // 0️⃣ DROP RETAINED MESSAGE
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
      // 2️⃣ Timestamp validation
      // ------------------------------------
      const sensorTs = new Date(Number(payload.ts) * 1000);
      const age = Date.now() - sensorTs.getTime();

      if (isNaN(sensorTs.getTime()) || age > SENSOR_MAX_AGE) {
        console.log("⏭️ [ACTUAL] Stale / invalid sensor timestamp");
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
      // 4️⃣ Basic value validation
      // ------------------------------------
      if (
        !isValid(actual.temperature) ||
        !isValid(actual.humidity) ||
        !isValid(actual.tvoc) ||
        !isValid(actual.eco2) ||
        !isValid(actual.dust)
      ) {
        console.warn("⚠️ [ACTUAL] Invalid sensor values", actual);
        return;
      }

      // ------------------------------------
      // 5️⃣ Duplicate & noise filter
      // ------------------------------------
      const last = await getLatestActualData(actual.deviceId);

      if (last) {
        // 5a. Duplicate timestamp
        const tsDiff = actual.ts.getTime() - last.ts.getTime();
        if (Math.abs(tsDiff) < MIN_TS_DIFF) {
          console.log("⏩ [ACTUAL] Skipped (duplicate timestamp)");
          return;
        }

        // 5b. No significant change
        if (!hasSignificantChange(actual, last)) {
          console.log("📉 [ACTUAL] Skipped (no significant change)");
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
      console.error(err.stack);
    }
  });
}
