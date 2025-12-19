// src/server.js
import dotenv from "dotenv";
dotenv.config();

import http from "http";
import app from "./app.js";

import "./mqtt/mqttHandler.js";
import { initWebSocket } from "./websocket/wsServer.js";
import { initActualMQTTWorker } from "./modules/actual/actual.mqttWorker.js";
import { initPredictionMQTTWorker } from "./modules/prediction/prediction.mqttWorker.js";

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

initWebSocket(server);

// Start workers
initActualMQTTWorker();
initPredictionMQTTWorker();

server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
