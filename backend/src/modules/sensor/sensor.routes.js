import express from "express";
import { getAllSensorData, deleteAllSensorData } from "./sensor.controller.js";

const router = express.Router();

router.get("/", getAllSensorData);
router.delete("/delete-all", deleteAllSensorData); // DEV only

export default router;
