import axios from "axios";

const PYTHON_ML_URL = process.env.ML_API_URL || "http://127.0.0.1:8500";

export let mlOnline = false;

// Health check every 5 seconds
export async function checkMLHealth() {
  try {
    await axios.get(`${PYTHON_ML_URL}/health`);
    mlOnline = true;
  } catch (err) {
    mlOnline = false;
  }
}

export async function requestMLPrediction(features) {
  if (!mlOnline) {
    throw new Error("ML service offline");
  }

  try {
    const res = await axios.post(`${PYTHON_ML_URL}/predict`, {
      data: features,
    });

    return res.data;
  } catch (err) {
    mlOnline = false;
    throw new Error("Failed to get prediction from ML service");
  }
}
