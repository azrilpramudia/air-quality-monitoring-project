import { getPredictionFromML } from "./predict.service.js";

export async function predictAQ(req, res) {
  try {
    const features = req.body.data; // [f1, f2, ...]

    if (!Array.isArray(features)) {
      return res.status(400).json({ error: "data must be an array" });
    }

    const prediction = await getPredictionFromML(features);

    return res.json({
      success: true,
      prediction: prediction,
    });
  } catch (err) {
    console.error("Prediction Controller Error:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
}
