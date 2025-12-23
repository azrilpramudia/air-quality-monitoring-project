import mqttClient from "../../mqtt/mqttClient.js";
import { savePrediction } from "./prediction.repository.js";
import { broadcastWS } from "../../websocket/wsServer.js";
import {
  requestMLPrediction,
  getMlStatus,
  checkMLHealth,
} from "../ml/predict.service.js";

// ========================================
// CONFIG (DEV MODE)
// ========================================

// Sensor kirim ±1 menit → kasih toleransi
const SENSOR_MAX_AGE = 2 * 60 * 1000; // 2 menit

// Prediction interval (DEV)
const PREDICT_INTERVAL = 60 * 1000; // 1 menit

// Per-device prediction lock
const lastPredictMap = new Map();

let mlWarned = false;

// ========================================
// WORKER
// ========================================

export function initPredictionMQTTWorker() {
  console.log("🧠 Prediction MQTT worker initialized.");

  mqttClient.on("message", async (_topic, msg, packet) => {
    try {
      // ------------------------------------
      // 0️⃣ DROP MQTT RETAINED MESSAGE
      // ------------------------------------
      if (packet?.retain) {
        console.log("⏭️ [PRED] Retained message skipped");
        return;
      }

      // ------------------------------------
      // 1️⃣ Parse JSON
      // ------------------------------------
      let data;
      try {
        data = JSON.parse(msg.toString());
      } catch {
        console.error("❌ [PRED] Invalid JSON");
        return;
      }

      if (!data.device_id || !data.ts) return;

      // ------------------------------------
      // 2️⃣ Timestamp freshness check
      // ------------------------------------
      const sensorTs = new Date(Number(data.ts) * 1000);
      const age = Date.now() - sensorTs.getTime();

      if (age > SENSOR_MAX_AGE) {
        console.log("⏭️ [PRED] Stale sensor data skipped");
        return;
      }

      // ------------------------------------
      // 3️⃣ ML Health Check
      // ------------------------------------
      const mlStatus = getMlStatus();

      if (!mlStatus.online) {
        if (!mlWarned) {
          console.log("⚠️ [PRED] ML offline — prediction skipped");
          console.log("Last health check:", mlStatus.lastCheck);
          mlWarned = true;
          await checkMLHealth();
        }
        return;
      }

      if (mlWarned) {
        console.log("✅ [PRED] ML back online");
        mlWarned = false;
      }

      // ------------------------------------
      // 4️⃣ Prediction interval guard
      // ------------------------------------
      const lastPred = lastPredictMap.get(data.device_id);

      if (lastPred && Date.now() - lastPred < PREDICT_INTERVAL) {
        return; // ⛔ belum waktunya predict
      }

      // ------------------------------------
      // 5️⃣ Request ML Prediction
      // ------------------------------------
      let mlRes;
      try {
        mlRes = await requestMLPrediction(
          data.device_id,
          24 // lookback hours
        );
      } catch (err) {
        console.error("❌ [PRED] ML request failed:", err.message);
        await checkMLHealth();
        return;
      }

      if (!Array.isArray(mlRes.prediction)) {
        console.warn("⚠️ [PRED] Invalid ML response");
        return;
      }

      // ------------------------------------
      // 6️⃣ Save Prediction to DB
      // ------------------------------------
      const saved = await savePrediction({
        device_id: data.device_id,
        generated_at: new Date(),
        forecast: mlRes.prediction,
        meta: {
          target_cols: mlRes.target_cols,
          model_ts: Date.now(),
        },
      });

      // Mark prediction time
      lastPredictMap.set(data.device_id, Date.now());

      // ------------------------------------
      // 7️⃣ Broadcast via WebSocket
      // ------------------------------------
      broadcastWS({
        type: "prediction_update",
        data: saved,
      });

      console.log(
        `✅ [PRED] Prediction saved & broadcast | device=${data.device_id}`
      );
      console.log("─".repeat(80));
    } catch (err) {
      console.error("❌ [PRED] Worker fatal error:", err.message);
    }
  });
}
