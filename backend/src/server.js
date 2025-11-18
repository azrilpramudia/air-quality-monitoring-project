import dotenv from "dotenv";
dotenv.config();

import http from "http";
import app from "./app.js";
import "./mqtt/mqttHandler.js";
import { initWebSocket } from "./websocket/wsServer.js";

const PORT = process.env.PORT || 4000;

const server = http.createServer(app);

// WebSocket run on same server
initWebSocket(server);

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
