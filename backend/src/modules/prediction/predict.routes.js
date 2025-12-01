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

// 2. Prediksi custom range (jam/durasi)
router.get("/prediction-range/:type", getPredictedRange);

// 3. Prediksi untuk hari ini (00:00 – 23:59)
router.get("/prediction-today/:type", getPredictionToday);

// 4. Prediksi untuk 7 hari ke depan
router.get("/prediction-7days/:type", getPrediction7Days);

// 5. Riwayat prediction (dari database)
router.get("/prediction-history/:type", getPredictionHistory);

export default router;
