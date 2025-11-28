import dotenv from "dotenv";
dotenv.config();

import http from "http";
import app from "./app.js";
import "./mqtt/mqttHandler.js";
import { initWebSocket } from "./websocket/wsServer.js";

const PORT = process.env.PORT || 4000;

const server = http.createServer(app);

// Start WebSocket on port 4001
initWebSocket();

server.listen(PORT, () => {
  console.log(`🚀 HTTP Server running on http://localhost:${PORT}`);
});
