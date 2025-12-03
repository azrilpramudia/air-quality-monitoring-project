import express from "express";
import { predictAQ } from "./predict.controller.js";

const router = express.Router();

// POST /api/predict
router.post("/", predictAQ);

export default router;
