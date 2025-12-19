import { buildFeatures } from "./featureBuilder.js";
import { updateHistory } from "./featureHistory.js";
import { requestMLPrediction, mlOnline } from "./predict.service.js";

export async function manualPredict(req, res, next) {
  try {
    const sensors = req.body;

    const required = ["temp_c", "rh_pct", "tvoc_ppb", "eco2_ppm", "dust_ugm3"];
    for (const key of required) {
      if (typeof sensors[key] !== "number") {
        return res.status(400).json({
          success: false,
          error: `Missing or invalid field: ${key}`,
        });
      }
    }

    sensors.timestamp = sensors.timestamp || Date.now();

    // Build features
    const features = buildFeatures(sensors);
    updateHistory(sensors);

    // ⛔ If ML is offline → DO NOT skip manual test
    if (!mlOnline) {
      console.log("⚠️ ML offline — forcing manual prediction attempt...");
    }

    // Force call ML even if mlOnline=false
    const ml = await requestMLPrediction(features);

    return res.json({
      success: true,
      features,
      prediction: ml.prediction,
      target_cols: ml.target_cols,
    });
  } catch (err) {
    console.error("❌ Manual Predict Error:", err);
    return res.status(500).json({
      success: false,
      message: "ML prediction failed.",
      error: err.message,
    });
  }
}
