import axios from "axios";

const PYTHON_ML_URL = process.env.ML_API_URL || "http://127.0.0.1:8500";

export async function requestMLPrediction(features) {
  try {
    const res = await axios.post(`${PYTHON_ML_URL}/predict`, {
      data: features,
    });

    return res.data; // { prediction: [...], target_cols: [...] }
  } catch (err) {
    console.error("ML service error:", err.message);
    throw new Error("Failed to get prediction from ML service");
  }
}
