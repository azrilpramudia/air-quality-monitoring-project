import { WebSocketServer } from "ws";

let wss = null;

export const initWebSocket = () => {
  wss = new WebSocketServer({ port: 4001 });
  console.log("🔥 WebSocket Server running on ws://localhost:4001");

  wss.on("connection", (ws) => {
    console.log("⚡ Client Connected");

    ws.isAlive = true;
    ws.on("pong", () => (ws.isAlive = true));

    ws.send(
      JSON.stringify({
        type: "connected",
        message: "WebSocket is ready",
      })
    );
  });

  // heartbeat every 30 seconds
  setInterval(() => {
    wss.clients.forEach((ws) => {
      if (!ws.isAlive) return ws.terminate(); // disconnected client
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);
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
