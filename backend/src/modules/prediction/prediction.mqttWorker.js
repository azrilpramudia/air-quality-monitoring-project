import mqttClient from "../../mqtt/mqttClient.js";
import { updateHistory } from "./featureHistory.js";
import { buildFeatures } from "./featureBuilder.js";
import { savePrediction } from "./prediction.repository.js";
import { broadcastWS } from "../../websocket/wsServer.js";
import {
  requestMLPrediction,
  getMlStatus,
  checkMLHealth,
} from "./predict.service.js";

const safeNum = (v) =>
  typeof v === "number"
    ? v
    : typeof v === "string" && v.trim() !== ""
    ? Number(v)
    : 0;

// Prevent offline log spam
let mlWarned = false;

// ========================================
// VALIDATION HELPERS
// ========================================

function validatePredictions(preds, sensors) {
  if (!preds || !Array.isArray(preds)) {
    console.error("❌ [PRED] Invalid prediction format:", preds);
    return false;
  }

  const bounds = {
    temp_c: { min: -10, max: 60 },
    rh_pct: { min: 0, max: 100 },
    tvoc_ppb: { min: 0, max: 10000 },
    eco2_ppm: { min: 0, max: 10000 },
    dust_ugm3: { min: 0, max: 1000 },
  };

  const targetCols = ["temp_c", "rh_pct", "tvoc_ppb", "eco2_ppm", "dust_ugm3"];

  for (let i = 0; i < Math.min(preds.length, targetCols.length); i++) {
    const value = preds[i];
    const col = targetCols[i];

    if (value === null || value === undefined || isNaN(value)) {
      console.error(`❌ [PRED] Invalid value for ${col}: ${value}`);
      return false;
    }

    const bound = bounds[col];
    if (bound && (value < bound.min || value > bound.max)) {
      console.error(
        `❌ [PRED] ${col} out of bounds: ${value} (expected ${bound.min}-${bound.max})`
      );
      return false;
    }
  }

  return true;
}

function sanitizePredictions(preds) {
  const bounds = {
    temp_c: { min: -10, max: 60 },
    rh_pct: { min: 0, max: 100 },
    tvoc_ppb: { min: 0, max: 10000 },
    eco2_ppm: { min: 0, max: 10000 },
    dust_ugm3: { min: 0, max: 1000 },
  };

  const targetCols = ["temp_c", "rh_pct", "tvoc_ppb", "eco2_ppm", "dust_ugm3"];

  return preds.slice(0, 5).map((value, i) => {
    const col = targetCols[i];
    const bound = bounds[col];

    if (!bound) return value;
    return Math.max(bound.min, Math.min(bound.max, value));
  });
}

// ========================================
// MAIN WORKER
// ========================================

export function initPredictionMQTTWorker() {
  console.log("🧠 Prediction MQTT worker initialized.");

  mqttClient.on("message", async (topic, msg) => {
    try {
      const raw = msg.toString();

      // -----------------------------
      // 1) Validate MQTT JSON
      // -----------------------------
      let data;
      try {
        data = JSON.parse(raw);
      } catch {
        console.error("❌ [PRED] Invalid JSON:", raw);
        return;
      }

      // -----------------------------
      // 2) Normalize sensors
      // -----------------------------
      const sensors = {
        temp_c: safeNum(data.temp_c),
        rh_pct: safeNum(data.rh_pct),
        tvoc_ppb: safeNum(data.tvoc_ppb),
        eco2_ppm: safeNum(data.eco2_ppm),
        dust_ugm3: safeNum(data.dust_ugm3),
        timestamp: Number(data.ts) || Date.now(),
      };

      // -----------------------------
      // 3) Prepare ML features
      // -----------------------------
      updateHistory(sensors);
      const features = buildFeatures(sensors);

      // -----------------------------
      // 4) Check ML status
      // -----------------------------
      const mlStatus = getMlStatus();

      if (!mlStatus.online) {
        if (!mlWarned) {
          console.log("⚠️ [PRED] ML service offline — prediction skipped");
          console.log(`Last health check: ${mlStatus.lastCheck}`);
          mlWarned = true;
          console.log("🔄 [PRED] Attempting to reconnect to ML service...");
          await checkMLHealth();
        }
        return;
      }

      if (mlWarned) {
        console.log("✅ [PRED] ML service is back online!");
        mlWarned = false;
      }

      // -----------------------------
      // 5) Request ML prediction
      // -----------------------------
      let mlRes;
      try {
        mlRes = await requestMLPrediction(features);
      } catch (err) {
        console.error("❌ [PRED] ML request failed:", err.message);
        if (err.message.includes("offline") || err.code === "ECONNREFUSED") {
          await checkMLHealth();
        }
        return;
      }

      // -----------------------------
      // 6) Validate ML response
      // -----------------------------
      if (!mlRes || !mlRes.prediction) {
        console.error("❌ [PRED] Invalid ML response:", mlRes);
        return;
      }

      let preds = Array.isArray(mlRes.prediction?.[0])
        ? mlRes.prediction[0]
        : mlRes.prediction;

      let target_cols = mlRes.target_cols || [
        "temp_c",
        "rh_pct",
        "tvoc_ppb",
        "eco2_ppm",
        "dust_ugm3",
      ];

      // ============================================
      // 7) FIX: Extract only first 5 predictions AND target_cols
      // ============================================
      const EXPECTED_TARGETS = 5;
      const standardTargets = [
        "temp_c",
        "rh_pct",
        "tvoc_ppb",
        "eco2_ppm",
        "dust_ugm3",
      ];

      // Check if model returned multi-step forecast
      if (
        preds.length > EXPECTED_TARGETS ||
        target_cols.length > EXPECTED_TARGETS
      ) {
        console.warn(
          `⚠️ [PRED] Model returned multi-step forecast:`,
          `{ predictions: ${preds.length}, target_cols: ${target_cols.length} }`
        );
        console.warn(
          `⚠️ [PRED] Extracting first timestep only (${EXPECTED_TARGETS} values)`
        );

        // Extract only first timestep for predictions
        preds = preds.slice(0, EXPECTED_TARGETS);

        // Fix target_cols: use standard or slice
        if (target_cols.length > EXPECTED_TARGETS) {
          // If ML returned long array, slice it
          target_cols = target_cols.slice(0, EXPECTED_TARGETS);
        }

        // Validate target_cols are correct
        if (target_cols.length !== EXPECTED_TARGETS) {
          console.warn(`⚠️ [PRED] Invalid target_cols, using defaults`);
          target_cols = standardTargets;
        }

        console.log(
          `✅ [PRED] Normalized to ${EXPECTED_TARGETS} predictions:`,
          {
            temp_c: preds[0]?.toFixed(2),
            rh_pct: preds[1]?.toFixed(2),
            tvoc_ppb: preds[2]?.toFixed(0),
            eco2_ppm: preds[3]?.toFixed(0),
            dust_ugm3: preds[4]?.toFixed(2),
          }
        );
      }

      // Final safety check
      if (preds.length !== target_cols.length) {
        console.error(
          `❌ [PRED] Length mismatch after normalization:`,
          `{ preds: ${preds.length}, target_cols: ${target_cols.length} }`
        );
        console.error(`❌ [PRED] Forcing standard targets`);
        target_cols = standardTargets.slice(0, preds.length);
      }

      // -----------------------------
      // 8) Validate & sanitize predictions
      // -----------------------------
      if (!validatePredictions(preds, sensors)) {
        console.error("❌ [PRED] Validation failed, sanitizing...");
        preds = sanitizePredictions(preds);
        console.log("✅ [PRED] Sanitized to:", {
          temp_c: preds[0]?.toFixed(2),
          rh_pct: preds[1]?.toFixed(2),
          tvoc_ppb: preds[2]?.toFixed(0),
          eco2_ppm: preds[3]?.toFixed(0),
          dust_ugm3: preds[4]?.toFixed(2),
        });
      }

      // -----------------------------
      // 9) Log prediction summary
      // -----------------------------
      console.log("📊 [PRED] Prediction summary:", {
        timestamp: new Date(sensors.timestamp).toISOString(),
        current: {
          temp_c: sensors.temp_c.toFixed(1),
          rh_pct: sensors.rh_pct.toFixed(1),
          tvoc_ppb: sensors.tvoc_ppb,
          eco2_ppm: sensors.eco2_ppm,
          dust_ugm3: sensors.dust_ugm3.toFixed(1),
        },
        predicted: {
          temp_c: preds[0]?.toFixed(1),
          rh_pct: preds[1]?.toFixed(1),
          tvoc_ppb: Math.round(preds[2]),
          eco2_ppm: Math.round(preds[3]),
          dust_ugm3: preds[4]?.toFixed(1),
        },
      });

      // -----------------------------
      // 10) Save to DB
      // -----------------------------
      const saved = await savePrediction({
        timestamp: sensors.timestamp,
        sensors,
        features,
        prediction: preds,
        target_cols,
      });

      // -----------------------------
      // 11) Real-time broadcast
      // -----------------------------
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
      console.log("─".repeat(80)); // Separator for readability
    } catch (err) {
      console.error("❌ [PRED] Worker error:", err);
      console.error("Stack trace:", err.stack);
    }
  });
}
