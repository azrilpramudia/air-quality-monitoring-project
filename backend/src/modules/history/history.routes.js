// src/modules/history/history.routes.js
import { Router } from "express";
import { getHistory } from "./history.controller.js";

const router = Router();

// GET /api/history/:type
router.get("/:type", getHistory);

export default router;
