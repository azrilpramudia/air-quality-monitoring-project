import axios from "axios";

const PYTHON_ML_URL = process.env.ML_API_URL || "http://127.0.0.1:8500";

export let mlOnline = false;
let lastStatus = null; // to avoid spam messages

// Check only when needed, not every 5 sec
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
  if (!mlOnline) return null; // do NOT throw error

  try {
    const res = await axios.post(`${PYTHON_ML_URL}/predict`, {
      data: features,
    });
    return res.data;
  } catch (err) {
    // mark offline but DO NOT throw
    mlOnline = false;
    if (lastStatus !== false) {
      console.log("🔴 ML Offline");
      lastStatus = false;
    }
    return null; // backend continues gracefully
  }
}
