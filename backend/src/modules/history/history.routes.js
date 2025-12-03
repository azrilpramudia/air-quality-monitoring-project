import { Router } from "express";
import { getPredictionHistory } from "./predictionHistory.controller.js";

const router = Router();

router.get("/prediction", getPredictionHistory);

export default router;
