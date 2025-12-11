import axios from "axios";

const PYTHON_ML_URL = process.env.ML_API_URL || "http://127.0.0.1:8500";

export let mlOnline = false;
let lastStatus = null;

export async function checkMLHealth() {
  try {
    await axios.get(`${PYTHON_ML_URL}/health`);
    mlOnline = true;

    if (lastStatus !== true) {
      console.log("🟢 ML Online");
      lastStatus = true;
    }
  } catch (err) {
    mlOnline = false;

    if (lastStatus !== false) {
      console.log("🔴 ML Offline");
      lastStatus = false;
    }
  }
}

export async function requestMLPrediction(features) {
  try {
    const res = await axios.post(`${PYTHON_ML_URL}/predict`, {
      data: features,
    });
    mlOnline = true;
    return res.data;
  } catch (err) {
    mlOnline = false;
    throw new Error("Failed to get prediction from ML service");
  }
}
