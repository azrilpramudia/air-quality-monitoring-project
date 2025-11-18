import { Router } from "express";
import * as controller from "./sensor.controller.js";

const router = Router();

router.get("/", controller.getAll);

export default router;
