import axios from "axios";

const PYTHON_ML_URL = process.env.ML_API_URL || "http://127.0.0.1:8500";

export let mlOnline = true; // assume online unless predict fails

export async function requestMLPrediction(features) {
  try {
    const res = await axios.post(`${PYTHON_ML_URL}/predict`, {
      data: features,
    });

    mlOnline = true; // ML is alive if prediction succeeds
    return res.data;
  } catch (err) {
    mlOnline = false; // mark offline when prediction fails
    throw new Error("Failed to get prediction from ML service");
  }
}
