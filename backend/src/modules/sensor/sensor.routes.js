import express from "express";
import { getAllSensorData } from "./sensor.controller.js";

const router = express.Router();

router.get("/", getAllSensorData);

export default router;
