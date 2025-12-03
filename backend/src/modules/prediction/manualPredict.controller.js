import { buildFeatures } from "./featureBuilder.js";
import { updateHistory } from "./featureHistory.js";
import { requestMLPrediction } from "./predict.service.js";

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

    // auto timestamp if missing
    sensors.timestamp = sensors.timestamp || Date.now();

    // Build features using history
    const features = buildFeatures(sensors);

    // Update lag history AFTER building features
    updateHistory(sensors);

    // Send to ML backend
    const ml = await requestMLPrediction(features);

    return res.json({
      success: true,
      features,
      prediction: ml.prediction,
      target_cols: ml.target_cols,
    });
  } catch (err) {
    next(err);
  }
}
