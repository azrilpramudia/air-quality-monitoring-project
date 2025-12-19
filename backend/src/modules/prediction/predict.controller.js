import { requestMLPrediction, getMlStatus } from "../ml/predict.service.js";

export async function predictAQ(req, res) {
  try {
    // ----------------------------------
    // 1. Normalize input
    // ----------------------------------
    const features = req.body.features ?? req.body.data;

    if (!Array.isArray(features)) {
      return res.status(400).json({
        success: false,
        error: "features must be an array of numbers",
      });
    }

    if (features.length === 0) {
      return res.status(400).json({
        success: false,
        error: "features array is empty",
      });
    }

    // ----------------------------------
    // 2. Check ML service status
    // ----------------------------------
    const mlStatus = getMlStatus();
    if (!mlStatus.online) {
      return res.status(503).json({
        success: false,
        error: "ML service is offline",
        lastCheck: mlStatus.lastCheck,
      });
    }

    // ----------------------------------
    // 3. Request prediction
    // ----------------------------------
    const result = await requestMLPrediction(features);

    return res.json({
      success: true,
      prediction: result.prediction,
      target_cols: result.target_cols,
    });
  } catch (err) {
    console.error("❌ Prediction Controller Error:", err);

    // ----------------------------------
    // 4. Proper error mapping
    // ----------------------------------
    if (err.message?.includes("offline")) {
      return res.status(503).json({
        success: false,
        error: "ML service is offline",
      });
    }

    if (err.response?.status === 422) {
      return res.status(422).json({
        success: false,
        error: "Invalid feature payload",
        detail: err.response.data,
      });
    }

    return res.status(500).json({
      success: false,
      error: err.message || "Prediction failed",
    });
  }
}
