import { Router } from "express";
import { predictAQ } from "./predict.controller.js";
import { manualPredict } from "./manualPredict.controller.js";
import { testCreatePrediction } from "./prediction.test.controller.js";
import {
  getLatestPrediction,
  deleteAllPredictions,
} from "./prediction.extra.controller.js";

const router = Router();

router.post("/", predictAQ);
router.post("/manual", manualPredict);
router.post("/test-create", testCreatePrediction);
router.get("/latest", getLatestPrediction);
router.delete("/delete-all", deleteAllPredictions);

export default router;
