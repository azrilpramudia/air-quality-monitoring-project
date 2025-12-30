import { useEffect, useState, useRef } from "react";

export const useRealtimeSensor = () => {
  const [data, setData] = useState({
    temperature: 0,
    humidity: 0,
    tvoc: 0,
    eco2: 0,
    dust: 0,
    aqi: 0,
    ts: null,
  });

  const [connected, setConnected] = useState(false);

  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);
  const isConnecting = useRef(false);

  useEffect(() => {
    const connectWS = () => {
      if (isConnecting.current) return;
      isConnecting.current = true;

      const ws = new WebSocket(import.meta.env.VITE_WS_URL);
      wsRef.current = ws;

      console.log("🔗 WS URL:", import.meta.env.VITE_WS_URL);

      ws.onopen = () => {
        console.log("✅ WS Connected");
        setConnected(true);
        isConnecting.current = false;

        if (reconnectTimer.current) {
          clearInterval(reconnectTimer.current);
          reconnectTimer.current = null;
        }
      };

      ws.onmessage = (event) => {
        console.log("🔥 WS RAW MESSAGE:", event.data);

        try {
          const payload = JSON.parse(event.data);

          // ===============================
          // ✅ REALTIME SENSOR UPDATE (FIX)
          // ===============================
          if (payload.type === "sensor_update") {
            const d = payload.data;

            setData({
              temperature: d.temperature ?? 0,
              humidity: d.humidity ?? 0,
              tvoc: d.tvoc ?? 0,
              eco2: d.eco2 ?? 0,
              dust: d.dust ?? 0,
              aqi: d.aqi ?? 0,
              ts: d.ts ?? null,
            });
          }
        } catch (err) {
          console.error("❌ WS parse error:", err);
        }
      };

      ws.onerror = (err) => {
        console.error("❌ WS Error:", err);
        ws.close();
      };

      ws.onclose = () => {
        console.warn("⚠ WS Disconnected");
        setConnected(false);
        isConnecting.current = false;

        if (!reconnectTimer.current) {
          reconnectTimer.current = setInterval(connectWS, 3000);
        }
      };
    };

    connectWS();

    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimer.current) clearInterval(reconnectTimer.current);
    };
  }, []);

  return { data, connected };
};
