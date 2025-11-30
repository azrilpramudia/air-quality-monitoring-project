import express from "express";
import cors from "cors";
import sensorRoutes from "./modules/sensor/sensor.routes.js";
import predictionRoutes from "./modules/prediction/predict.routes.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json());

// Routes
app.use("/api/sensor", sensorRoutes);
app.use("/ai", predictionRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
