import mqttClient from "../../mqtt/mqttClient.js";
import { updateHistory } from "./featureHistory.js";
import { buildFeatures } from "./featureBuilder.js";
import { requestMLPrediction } from "./predict.service.js";
import { savePrediction } from "./prediction.repository.js";
import { broadcastWS } from "../../websocket/wsServer.js";

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

      // Validate JSON
      let data;
      try {
        data = JSON.parse(raw);
      } catch {
        console.error("❌ [PRED] Invalid JSON:", raw);
        return;
      }

      // Convert sensor values
      const sensors = {
        temp_c: safeNum(data.temp_c),
        rh_pct: safeNum(data.rh_pct),
        tvoc_ppb: safeNum(data.tvoc_ppb),
        eco2_ppm: safeNum(data.eco2_ppm),
        dust_ugm3: safeNum(data.dust_ugm3),
        timestamp: Number(data.ts) || Date.now(),
      };

      // 1) Update history BEFORE building lags
      updateHistory(sensors);

      // 2) Build 17 features
      const features = buildFeatures(sensors);

      // 3) Request ML prediction
      const mlRes = await requestMLPrediction(features);

      // Proper flattening
      const preds = Array.isArray(mlRes.prediction?.[0])
        ? mlRes.prediction[0]
        : mlRes.prediction;

      const target_cols = mlRes.target_cols;

      // 4) Save to DB
      const saved = await savePrediction({
        timestamp: sensors.timestamp,
        sensors,
        features,
        prediction: preds,
        target_cols,
      });

      // 5) Realtime broadcast
      broadcastWS({
        type: "prediction_update",
        data: {
          id: saved.id,
          timestamp: saved.timestamp,
          prediction: preds,
          target_cols,
        },
      });

      console.log("✅ [PRED] Saved & broadcast prediction id:", saved.id);
    } catch (err) {
      console.error("❌ [PRED] Worker error:", err);
    }
  });
}
