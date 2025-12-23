import mqttClient from "../../mqtt/mqttClient.js";
import {
  saveActualData,
  getLatestActualData,
  findActualByDeviceAndTs,
} from "./actual.repository.js";
import { broadcastWS } from "../../websocket/wsServer.js";

// ========================================
// CONFIG
// ========================================

const MAX_DATA_AGE = 5 * 60 * 1000; // 5 menit
const MIN_INTERVAL = 10_000; // 10 detik

const BOUNDS = {
  temperature: [-10, 60],
  humidity: [0, 100],
  tvoc: [0, 10000],
  eco2: [0, 10000],
  dust: [0, 1000],
};

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

// ========================================
// MQTT WORKER
// ========================================

export function initActualMQTTWorker() {
  console.log("📡 Actual MQTT worker initialized");

  mqttClient.on("message", async (_topic, msg) => {
    try {
      // 1️⃣ Parse JSON
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

      const sensorTs = new Date(Number(payload.ts) * 1000);
      const now = Date.now();

      // 2️⃣ DROP OLD / RETAINED MESSAGE
      if (now - sensorTs.getTime() > MAX_DATA_AGE) {
        console.log("⏭️ [ACTUAL] Old retained message skipped");
        return;
      }

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

      // 3️⃣ Sanity validation
      for (const key in BOUNDS) {
        const [min, max] = BOUNDS[key];
        const val = actual[key];

        if (!isValid(val) || val < min || val > max) {
          console.warn(`⚠️ [ACTUAL] Invalid ${key}:`, val);
          return;
        }
      }

      // 4️⃣ DUPLICATE CHECK (deviceId + ts)
      const exists = await findActualByDeviceAndTs(actual.deviceId, actual.ts);

      if (exists) {
        console.log("⏭️ [ACTUAL] Duplicate data skipped");
        return;
      }

      // 5️⃣ INTERVAL CHECK (BASED ON SENSOR ts)
      const last = await getLatestActualData(actual.deviceId);
      if (last) {
        const diff = actual.ts - last.ts;
        if (diff < MIN_INTERVAL) {
          console.log("⏩ [ACTUAL] Too frequent, skipped");
          return;
        }
      }

      // 6️⃣ Save to DB
      const saved = await saveActualData(actual);

      console.log(
        `💾 [ACTUAL] Saved | device=${
          saved.deviceId
        } | ts=${saved.ts.toISOString()}`
      );

      // 7️⃣ WebSocket broadcast
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
