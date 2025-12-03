import axios from "axios";

const PYTHON_API = "http://127.0.0.1:8500";

export async function getPredictionFromML(data) {
  try {
    const response = await axios.post(`${PYTHON_API}/predict`, {
      data: data,
    });

    return response.data.prediction;
  } catch (err) {
    console.error("ML Prediction Error:", err.message);
    throw new Error("Failed to connect to ML service");
  }
}
