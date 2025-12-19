import { WebSocketServer } from "ws";

let wss = null;
let hasLoggedConnection = false; // 🔥 Prevent repeated logs

export const initWebSocket = () => {
  wss = new WebSocketServer({ port: 4001 });
  console.log("🔥 WebSocket Server running on ws://localhost:4001");

  wss.on("connection", (ws) => {
    // Log only ONCE forever
    if (!hasLoggedConnection) {
      console.log("⚡ WebSocket Client Connected");
      hasLoggedConnection = true;
    }

    ws.send(
      JSON.stringify({
        type: "connected",
        message: "WebSocket is ready",
      })
    );
  });
};

export const broadcastWS = (message) => {
  if (!wss) return;

  const data = JSON.stringify(message);

  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(data);
    }
  });
};
