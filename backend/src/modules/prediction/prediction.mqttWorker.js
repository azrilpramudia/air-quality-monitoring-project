import mqttClient from "../../mqtt/mqttClient.js";
import { savePrediction } from "./prediction.repository.js";
import { broadcastWS } from "../../websocket/wsServer.js";
import {
  requestMLPrediction,
  getMlStatus,
  checkMLHealth,
} from "../ml/predict.service.js";

// ========================================
// HELPERS
// ========================================

const safeNum = (v) =>
  typeof v === "number"
    ? v
    : typeof v === "string" && v.trim() !== ""
    ? Number(v)
    : 0;

let mlWarned = false;

// ========================================
// MAIN WORKER (RAW-BASED, CORRECT)
// ========================================

export function initPredictionMQTTWorker() {
  console.log("🧠 Prediction MQTT worker (RAW-BASED) initialized.");

  mqttClient.on("message", async (topic, msg) => {
    try {
      // ------------------------------------
      // 1) Parse MQTT JSON
      // ------------------------------------
      let data;
      try {
        data = JSON.parse(msg.toString());
      } catch {
        console.error("❌ [PRED] Invalid JSON from MQTT");
        return;
      }

      if (!data.device_id || !data.ts) {
        console.warn("⚠️ [PRED] Missing device_id or ts, skipping");
        return;
      }

      const sensors = {
        device_id: data.device_id,
        ts: Number(data.ts),
        temp_c: safeNum(data.temp_c),
        rh_pct: safeNum(data.rh_pct),
        tvoc_ppb: safeNum(data.tvoc_ppb),
        eco2_ppm: safeNum(data.eco2_ppm),
        dust_ugm3: safeNum(data.dust_ugm3),
      };

      // ------------------------------------
      // 2) Check ML service status
      // ------------------------------------
      const mlStatus = getMlStatus();

      if (!mlStatus.online) {
        if (!mlWarned) {
          console.log("⚠️ [PRED] ML service offline — prediction skipped");
          console.log("Last health check:", mlStatus.lastCheck);
          mlWarned = true;
          await checkMLHealth();
        }
        return;
      }

      if (mlWarned) {
        console.log("✅ [PRED] ML service back online");
        mlWarned = false;
      }

      // ------------------------------------
      // 3) Request ML prediction (RAW request)
      // ------------------------------------
      let mlRes;
      try {
        mlRes = await requestMLPrediction({
          device_id: sensors.device_id,
          lookback_hours: 24, // MUST match training lag
        });
      } catch (err) {
        console.error("❌ [PRED] ML request failed:", err.message);
        await checkMLHealth();
        return;
      }

      if (!mlRes || !Array.isArray(mlRes.forecast)) {
        console.error("❌ [PRED] Invalid ML response:", mlRes);
        return;
      }

      // ------------------------------------
      // 4) Save prediction to DB
      // ------------------------------------
      const saved = await savePrediction({
        device_id: sensors.device_id,
        generated_at: new Date(),
        forecast: mlRes.forecast, // ARRAY WITH TIMESTAMP
        meta: mlRes.meta || {},
      });

      // ------------------------------------
      // 5) Real-time broadcast
      // ------------------------------------
      broadcastWS({
        type: "prediction_update",
        data: {
          id: saved.id,
          device_id: sensors.device_id,
          forecast: mlRes.forecast,
        },
      });

      console.log(
        `✅ [PRED] Prediction saved & broadcast | device=${sensors.device_id} | points=${mlRes.forecast.length}`
      );
      console.log("─".repeat(80));
    } catch (err) {
      console.error("❌ [PRED] Worker fatal error:", err);
      console.error(err.stack);
    }
  });
}
