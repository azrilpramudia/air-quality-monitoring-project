import { Router } from "express";
import { predictAQ } from "./predict.controller.js";
import { manualPredict } from "./manualPredict.controller.js";

const router = Router();

router.post("/", predictAQ); // existing
router.post("/manual", manualPredict); // new

export default router;
