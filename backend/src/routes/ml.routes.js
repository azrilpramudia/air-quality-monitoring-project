import express from "express";
import axios from "axios";

const router = express.Router();
const ML_URL = "http://127.0.0.1:8500";

router.get("/health", async (_req, res) => {
  try {
    const ml = await axios.get(`${ML_URL}/health`, { timeout: 3000 });
    res.json({
      backend: "ok",
      ml: ml.data,
    });
  } catch (err) {
    res.status(503).json({
      backend: "ok",
      ml: "offline",
    });
  }
});

router.post("/predict", async (req, res) => {
  try {
    const { device_id, lookback_hours } = req.body;

    const ml = await axios.post(
      `${ML_URL}/predict`,
      { device_id, lookback_hours },
      { timeout: 10_000 }
    );

    res.json(ml.data);
  } catch (err) {
    res.status(500).json({
      error: "ML prediction failed",
      detail: err.message,
    });
  }
});

router.post("/train", async (req, res) => {
  try {
    const ml = await axios.post(`${ML_URL}/train`, req.body, {
      timeout: 60_000,
    });

    res.json({
      status: "training started",
      ml: ml.data,
    });
  } catch (err) {
    res.status(500).json({
      error: "Training failed",
      detail: err.message,
    });
  }
});

export default router;
