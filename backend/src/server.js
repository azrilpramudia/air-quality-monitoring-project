import dotenv from "dotenv";
dotenv.config();

import http from "http";
import app from "./app.js";

import "./mqtt/mqttHandler.js";
import { initWebSocket } from "./websocket/wsServer.js";
import { initPredictionMQTTWorker } from "./modules/prediction/prediction.mqttWorker.js";
import { checkMLHealth } from "./modules/prediction/predict.service.js";

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Start WebSocket server using same HTTP server
initWebSocket(server);

// Start automatic prediction worker
initPredictionMQTTWorker();

// Check ML server every 5 seconds
setInterval(checkMLHealth, 5000);

console.log("🩺 ML health monitor started...");

server.listen(PORT, () => {
  console.log(`🚀 HTTP Server running on http://localhost:${PORT}`);
});
