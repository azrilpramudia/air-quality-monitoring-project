import { Router } from "express";
import { getPredictionHistory } from "./predictionHistory.controller.js";
import { getSensorHistory } from "./history.controller.js";

const router = Router();

router.get("/prediction", getPredictionHistory);
router.get("/:sensorType", getSensorHistory);

export default router;
