import express from "express";
import cors from "cors";

import sensorRoutes from "./modules/actual/actual.routes.js";
import predictionRoutes from "./modules/prediction/predict.routes.js";
import historyRoutes from "./modules/history/history.routes.js";

import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

// CORS
app.use(
  cors({
    origin: "*", // During dev, allow all
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ROUTES
app.use("/api/actual", sensorRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/predict", predictionRoutes);

// Middleware (404 + error)
app.use(notFound);
app.use(errorHandler);

export default app;
