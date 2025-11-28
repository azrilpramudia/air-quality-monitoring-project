import express from "express";
import sensorRoutes from "./modules/sensor/sensor.routes.js";
import predictionRoutes from "./modules/prediction/predict.routes.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(express.json());

// Routes
app.use("/api/sensor", sensorRoutes);
app.use("/ai", predictionRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
