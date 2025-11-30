import express from "express";
import { getPrediction } from "./predict.controller.js";
import { checkPythonHealth } from "./predict.health.controller.js";

const router = express.Router();

router.post("/predict", getPrediction);
router.get("/health", checkPythonHealth);

export default router;
