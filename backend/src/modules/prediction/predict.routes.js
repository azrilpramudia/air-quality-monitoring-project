import { Router } from "express";
import { getPrediction } from "./predict.controller.js";

const router = Router();

// MAIN ENDPOINT
// GET /ai/prediction/:type
router.get("/prediction/:type", getPrediction);

export default router;
