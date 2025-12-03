import mqttClient from "../../mqtt/mqttClient.js";
import { updateHistory } from "./featureHistory.js";
import { buildFeatures } from "./featureBuilder.js";
import { requestMLPrediction } from "./predict.service.js";
import { savePrediction } from "./prediction.repository.js";
import { broadcastWS } from "../../websocket/wsServer.js";

// simple helper
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

      // You can filter by topic if needed
      // if (topic !== process.env.MQTT_TOPIC) return;

      const sensors = {
        temp_c: safeNum(data.temp_c),
        rh_pct: safeNum(data.rh_pct),
        tvoc_ppb: safeNum(data.tvoc_ppb),
        eco2_ppm: safeNum(data.eco2_ppm),
        dust_ugm3: safeNum(data.dust_ugm3),
        timestamp: data.ts || data.timestamp || Date.now(),
      };

      // 1) Build 17 features using *previous* history
      const features = buildFeatures(sensors);

      // 2) Update history with current reading
      updateHistory(sensors);

      // 3) Call Python ML model
      const mlRes = await requestMLPrediction(features);
      const { prediction, target_cols } = mlRes;

      // 4) Save to DB
      const saved = await savePrediction({
        timestamp: sensors.timestamp,
        sensors,
        features,
        prediction,
        target_cols,
      });

      // 5) Broadcast via WebSocket
      broadcastWS({
        type: "prediction_update",
        data: {
          id: saved.id,
          timestamp: saved.timestamp,
          sensors,
          target_cols,
          prediction,
        },
      });

      console.log("✅ [PRED] Saved & broadcast prediction id:", saved.id);
    } catch (err) {
      console.error("❌ [PRED] Worker error:", err);
    }
  });
}
