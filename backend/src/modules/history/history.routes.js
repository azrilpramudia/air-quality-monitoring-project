import { Router } from "express";
import { getSensorHistory } from "./history.controller.js";

const router = Router();

// /api/history/temperature?hours=24
router.get("/:sensorType", getSensorHistory);

export default router;
