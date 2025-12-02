import { Router } from "express";

import {
  getPrediction,
  getPredictedRange,
  getPredictionToday,
  getPrediction7Days,
  getPredictionHistory,
} from "./predict.controller.js";

const router = Router();

// 1. Prediksi 24 jam
router.get("/prediction/:type", getPrediction);

// 2. Prediksi custom range
router.get("/prediction-range/:type", getPredictedRange);

// 3. Prediksi hari ini
router.get("/prediction-today/:type", getPredictionToday);

// 4. Prediksi 7 hari
router.get("/prediction-7days/:type", getPrediction7Days);

// 5. Riwayat prediksi dari DB
router.get("/prediction-history/:type", getPredictionHistory);

export default router;
