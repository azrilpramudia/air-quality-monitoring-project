import mqttClient from "../../mqtt/mqttClient.js";
import { updateHistory } from "./featureHistory.js";
import { buildFeatures } from "./featureBuilder.js";
import { requestMLPrediction } from "./predict.service.js";
import { savePrediction } from "./prediction.repository.js";
import { broadcastWS } from "../../websocket/wsServer.js";

// Ensure number conversion safe
const safeNum = (v) =>
  typeof v === "number"
    ? v
    : typeof v === "string" && v.trim() !== ""
    ? Number(v)
    : 0;

export function initPredictionMQTTWorker() {
  console.log("🧠 Prediction MQTT worker initialized.");

  mqttClient.on("message", async (topic, msg) => {
    try {
      const raw = msg.toString();

      let data;
      try {
        data = JSON.parse(raw);
      } catch {
        console.error("❌ [PRED] Invalid JSON from MQTT:", raw);
        return;
      }

      const sensors = {
        temp_c: safeNum(data.temp_c),
        rh_pct: safeNum(data.rh_pct),
        tvoc_ppb: safeNum(data.tvoc_ppb),
        eco2_ppm: safeNum(data.eco2_ppm),
        dust_ugm3: safeNum(data.dust_ugm3),
        timestamp: data.ts || Date.now(),
      };

      // 1) Update history first
      updateHistory(sensors);

      // 2) Build features
      const features = buildFeatures(sensors);

      // 3) Ask ML model
      const mlRes = await requestMLPrediction(features);

      let preds = mlRes.prediction;
      if (Array.isArray(preds[0])) preds = preds[0]; // flatten multi-output

      const target_cols = mlRes.target_cols;

      // 4) Save everything to DB
      const saved = await savePrediction({
        timestamp: sensors.timestamp,
        sensors,
        features,
        prediction: preds,
        target_cols,
      });

      // 5) Broadcast real-time prediction to frontend
      broadcastWS({
        type: "prediction_update",
        data: saved,
      });

      console.log("✅ [PRED] Saved & broadcast prediction id:", saved.id);
    } catch (err) {
      console.error("❌ [PRED] Worker error:", err);
    }
  });
}
