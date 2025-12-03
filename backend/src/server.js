import dotenv from "dotenv";
dotenv.config();

import http from "http";
import app from "./app.js";

// Start MQTT sensor listener
import "./mqtt/mqttHandler.js";

// Start prediction pipeline
import { initPredictionMQTTWorker } from "./modules/prediction/prediction.mqttWorker.js";

// WebSocket server
import { initWebSocket } from "./websocket/wsServer.js";

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Start WebSocket
initWebSocket(server);

// Start prediction worker
initPredictionMQTTWorker();

server.listen(PORT, () => {
  console.log(`🚀 HTTP Server running on http://localhost:${PORT}`);
});
