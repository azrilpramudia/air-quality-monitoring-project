export const initWS = () => {
  const ws = new WebSocket("ws://localhost:4000"); // backend WebSocket

  ws.onopen = () => {
    console.log("🔌 WebSocket Connected to Backend");
  };

  ws.onmessage = (msg) => {
    const data = JSON.parse(msg.data);
    console.log("📡 WS DATA:", data);

    // handle incoming sensor update
    if (data.event === "sensor_update") {
      console.log("🌡️ Sensor Update:", data.data);
    }
  };

  ws.onerror = (err) => console.error("WS Error", err);

  return ws;
};
