import mqttClient from "../../mqtt/mqttClient.js";
import { updateHistory } from "./featureHistory.js";
import { buildFeatures } from "./featureBuilder.js";
import { requestMLPrediction } from "./predict.service.js";
import { savePrediction } from "./prediction.repository.js";
import { broadcastWS } from "../../websocket/wsServer.js";

const SENSOR_TOPIC = "sensors/air-quality"; // use your real topic

export function initPredictionMQTTWorker() {
  mqttClient.on("connect", () => {
    console.log("[MQTT] Connected, subscribing to", SENSOR_TOPIC);
    mqttClient.subscribe(SENSOR_TOPIC);
  });

  mqttClient.on("message", async (topic, msg) => {
    if (topic !== SENSOR_TOPIC) return;

    let payload;
    try {
      payload = JSON.parse(msg.toString());
    } catch (err) {
      console.error("[MQTT] Invalid JSON payload:", err.message);
      return;
    }

    const sensors = {
      temp_c: payload.temp_c,
      rh_pct: payload.rh_pct,
      tvoc_ppb: payload.tvoc_ppb,
      eco2_ppm: payload.eco2_ppm,
      dust_ugm3: payload.dust_ugm3,
      timestamp: payload.timestamp,
    };

    // 1) Build features BEFORE updating history (so lag1, lag2 = previous timesteps)
    const features = buildFeatures(sensors);

    // 2) Now update history with current reading
    updateHistory(sensors);

    try {
      // 3) Call Python ML service
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

      // 5) Broadcast to WebSocket clients
      broadcastWS("prediction:new", {
        id: saved.id,
        timestamp: saved.timestamp,
        sensors,
        target_cols,
        prediction,
      });

      console.log("[PREDICTION] Saved & broadcasted prediction id", saved.id);
    } catch (err) {
      console.error("[PREDICTION] Error in pipeline:", err.message);
    }
  });
}
