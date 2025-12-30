import mqttClient from "../../mqtt/mqttClient.js";
import { savePrediction } from "./prediction.repository.js";
import { broadcastWS } from "../../websocket/wsServer.js";
import {
  requestMLPrediction,
  getMlStatus,
  checkMLHealth,
} from "../ml/predict.service.js";

const SENSOR_MAX_AGE = 2 * 60 * 1000; // Sensor tolerance (sensor kirim per menit)
const PREDICT_INTERVAL = 60 * 60 * 1000; // 🔥 Prediction hanya 1x per jam

// Per-device prediction lock
const lastPredictMap = new Map();

let mlWarned = false;

// ========================================
// WORKER
// ========================================

export function initPredictionMQTTWorker() {
  console.log("🧠 Prediction MQTT worker initialized (HOURLY MODE)");

  mqttClient.on("message", async (_topic, msg, packet) => {
    try {
      // 0️⃣ Drop retained message
      if (packet?.retain) return;

      // 1️⃣ Parse JSON
      let data;
      try {
        data = JSON.parse(msg.toString());
      } catch {
        console.error("❌ [PRED] Invalid JSON");
        return;
      }

      if (!data.device_id || !data.ts) return;

      // 2️⃣ Timestamp validation
      const sensorTs = new Date(Number(data.ts) * 1000);
      const age = Date.now() - sensorTs.getTime();

      if (isNaN(sensorTs.getTime()) || age > SENSOR_MAX_AGE) {
        console.log("⏭️ [PRED] Stale sensor data skipped");
        return;
      }

      // 3️⃣ ML Health Check
      const mlStatus = getMlStatus();

      if (!mlStatus.online) {
        if (!mlWarned) {
          console.log("⚠️ [PRED] ML offline — prediction skipped");
          mlWarned = true;
          await checkMLHealth();
        }
        return;
      }

      if (mlWarned) {
        console.log("✅ [PRED] ML back online");
        mlWarned = false;
      }

      // 4️⃣ HOURLY prediction guard (KUNCI UTAMA)
      const lastPred = lastPredictMap.get(data.device_id);

      if (lastPred && Date.now() - lastPred < PREDICT_INTERVAL) {
        console.log("⏳ [PRED] Waiting next hourly prediction");
        return;
      }

      // 5️⃣ Request ML Prediction
      let mlRes;
      try {
        mlRes = await requestMLPrediction(
          data.device_id,
          24 // lookback 24 jam
        );
      } catch (err) {
        console.error("❌ [PRED] ML request failed:", err.message);
        await checkMLHealth();
        return;
      }

      if (!Array.isArray(mlRes.prediction) || mlRes.prediction.length === 0) {
        console.warn("⚠️ [PRED] Empty or invalid ML prediction");
        return;
      }

      // 6️⃣ Save prediction
      const saved = await savePrediction({
        device_id: data.device_id,
        generated_at: new Date(),
        forecast: mlRes.prediction, // ⬅️ ARRAY
        meta: {
          target_cols: mlRes.target_cols,
          lookback_hours: 24,
          interval: "1h",
          model_ts: Date.now(),
        },
      });

      // Lock prediction time
      lastPredictMap.set(data.device_id, Date.now());

      // 7️⃣ Broadcast
      broadcastWS({
        type: "prediction_update",
        data: {
          deviceId: saved.deviceId,
          timestamp: saved.timestamp,
          predictionCount: mlRes.prediction.length,
        },
      });

      console.log(
        `✅ [PRED] HOURLY prediction saved | device=${data.device_id}`
      );
      console.log("─".repeat(80));
    } catch (err) {
      console.error("❌ [PRED] Worker fatal error:", err.message);
      console.error(err.stack);
    }
  });
}
