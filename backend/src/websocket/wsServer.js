import { WebSocketServer } from "ws";

let wss;

export const initWebSocket = (server) => {
  wss = new WebSocketServer({ server });

  wss.on("connection", (ws) => {
    console.log("⚡ Client Connected");

    ws.send(JSON.stringify({ event: "connected", message: "WebSocket Ready" }));
  });

  console.log("🔥 WebSocket Server Running");
};

export const broadcastWS = (data) => {
  if (!wss) return;

  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(JSON.stringify(data));
    }
  });
};
