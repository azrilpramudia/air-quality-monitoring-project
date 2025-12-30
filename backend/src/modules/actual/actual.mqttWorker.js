import mqttClient from "../../mqtt/mqttClient.js";
import { saveActualData, getLatestActualData } from "./actual.repository.js";

const SENSOR_MAX_AGE = 2 * 60 * 1000; // 2 menit
const SAVE_INTERVAL = 60 * 60 * 1000; // 1 jam

const CHANGE_THRESHOLD = {
  temperature: 0.2,
  humidity: 0.5,
  tvoc: 10,
  eco2: 20,
  dust: 1,
};

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

export function initActualMQTTWorker() {
  console.log("📡 Actual MQTT worker initialized (HOURLY MODE)");

  mqttClient.on("message", async (_topic, msg, packet) => {
    try {
      if (packet?.retain) return;

      const payload = JSON.parse(msg.toString());
      if (!payload.device_id || !payload.ts) return;

      const sensorTs = new Date(payload.ts * 1000);
      if (Date.now() - sensorTs.getTime() > SENSOR_MAX_AGE) return;

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

      if (
        !isValid(actual.temperature) ||
        !isValid(actual.humidity) ||
        !isValid(actual.tvoc) ||
        !isValid(actual.eco2) ||
        !isValid(actual.dust)
      ) {
        return;
      }

      const last = await getLatestActualData(actual.deviceId);

      if (last) {
        const diff = actual.ts.getTime() - last.ts.getTime();
        if (diff < SAVE_INTERVAL) {
          console.log("⏳ [ACTUAL] Waiting next hour");
          return;
        }

        if (!hasSignificantChange(actual, last)) {
          console.log("📉 [ACTUAL] No significant hourly change");
          return;
        }
      }

      await saveActualData(actual);
      console.log(`💾 [ACTUAL] Saved HOURLY | ${actual.deviceId}`);
    } catch (err) {
      console.error("❌ [ACTUAL] Error:", err.message);
    }
  });
}
