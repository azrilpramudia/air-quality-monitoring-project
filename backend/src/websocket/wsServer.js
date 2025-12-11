import { WebSocketServer } from "ws";

let wss = null;

export const initWebSocket = () => {
  wss = new WebSocketServer({ port: 4001 });
  console.log("🔥 WebSocket Server running on ws://localhost:4001");

  wss.on("connection", (ws) => {
    // Log only number of active WS clients, not each connection
    console.log(`⚡ WebSocket clients connected: ${wss.clients.size}`);

    // Mark this client as logged so no duplicate logs
    ws._logged = true;

    ws.send(
      JSON.stringify({
        type: "connected",
        message: "WebSocket is ready",
      })
    );

    ws.on("close", () => {
      console.log(`🔌 Client disconnected — Active: ${wss.clients.size}`);
    });
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
