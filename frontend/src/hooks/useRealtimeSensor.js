import { useEffect, useState, useRef } from "react";

export const useRealtimeSensor = () => {
  const [data, setData] = useState({
    temperature: 0,
    humidity: 0,
    tvoc: 0,
    eco2: 0,
    dust: 0,
  });

  const [connected, setConnected] = useState(false);

  const wsRef = useRef(null);
  const reconnectRef = useRef(null);

  useEffect(() => {
    const connectWS = () => {
      const ws = new WebSocket(import.meta.env.VITE_WS_URL);
      wsRef.current = ws;

      console.log("WS URL:", import.meta.env.VITE_WS_URL);

      ws.onopen = () => {
        console.log("🔌 WS Connected");
        setConnected(true);

        if (reconnectRef.current) {
          clearInterval(reconnectRef.current);
          reconnectRef.current = null;
        }
      };

      ws.onmessage = (msg) => {
        console.log("🔥 WS RAW MESSAGE:", msg.data);

        try {
          const payload = JSON.parse(msg.data);

          if (payload.type === "sensor_update") {
            console.log("📥 Realtime Update:", payload.data);
            setData(payload.data);
          }
        } catch (err) {
          console.error("WS parse error:", err);
        }
      };

      ws.onclose = () => {
        console.warn("⚠ WS Disconnected");
        setConnected(false);

        if (!reconnectRef.current) {
          reconnectRef.current = setInterval(connectWS, 2000);
        }
      };

      ws.onerror = (err) => {
        console.error("WS Error:", err);
        ws.close();
      };
    };

    connectWS();

    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectRef.current) clearInterval(reconnectRef.current);
    };
  }, []);

  return { data, connected };
};
