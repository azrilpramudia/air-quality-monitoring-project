import { useEffect, useState } from "react";
import { connectMQTT } from "../lib/mqttConfig.js";

export const useMQTT = () => {
  const [data, setData] = useState({
    aqi: 0,
    temperature: 0,
    humidity: 0,
    tvoc: 0,
    eco2: 0,
    dust: 0,
  });
  const [isConnected, setIsConnected] = useState(false);
  const [activeBroker, setActiveBroker] = useState(null);
  const [clientId, setClientId] = useState(null);
  const [log, setLog] = useState([]);

  useEffect(() => {
    const pushLog = (msg) => {
      setLog((prev) => [
        ...prev.slice(-15),
        { time: new Date().toLocaleTimeString("id-ID"), message: msg },
      ]);
    };

    const { client, clientId, broker } = connectMQTT(
      (incomingData) => {
        setData(incomingData);
      },
      (connected) => {
        setIsConnected(connected);
        pushLog(connected ? "✅ Connected" : "⚠️ Disconnected / Reconnecting...");
      },
      (brokerUrl) => setActiveBroker(brokerUrl)
    );

    setClientId(clientId);
    setActiveBroker(broker);
    pushLog(`🔌 Connecting to ${broker} as ${clientId}`);

    return () => {
      client?.end();
      pushLog("🛑 MQTT connection closed");
    };
  }, []);

  return { data, isConnected, activeBroker, clientId, log };
};
