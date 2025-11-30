import { Router } from "express";
import { getPrediction } from "./predict.controller.js";

const router = Router();

// /ai/prediction/:type
router.get("/prediction/:type", getPrediction);

export default router;
