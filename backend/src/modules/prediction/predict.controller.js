import { requestMLPrediction } from "./predict.service.js";

export async function predictAQ(req, res) {
  try {
    const features = req.body.data; // expects: [f1, f2, ...]

    if (!Array.isArray(features)) {
      return res.status(400).json({ error: "data must be an array" });
    }

    const prediction = await requestMLPrediction(features);

    return res.json({
      success: true,
      prediction: prediction.prediction,
      target_cols: prediction.target_cols,
    });
  } catch (err) {
    console.error("Prediction Controller Error:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
}
