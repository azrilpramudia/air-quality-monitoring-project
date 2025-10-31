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

  useEffect(() => {
    // Take prefix from .env
    const prefix = import.meta.env.VITE_MQTT_CLIENT_PREFIX || "react_client_";
    const clientId = `${prefix}${Math.random().toString(16).substring(2, 8)}`;
    setClientId(clientId);

    console.log("🟢 MQTT connecting...");
    console.log(`📦 Using Client ID: ${clientId}`);
    console.log(`🌍 Broker: ${import.meta.env.VITE_MQTT_URL}`);

    connectMQTT(
      (incomingData) => setData(incomingData),
      (connected, brokerUrl) => {
        setIsConnected(connected);
        if (connected) {
          setActiveBroker(brokerUrl);
          console.log(`✅ Connected to MQTT Broker: ${brokerUrl}`);
          console.log(`🔗 Client ID: ${clientId}`);
        } else {
          console.warn("⚠️ MQTT disconnected or reconnecting...");
        }
      }
    );
  }, []);

  return { data, isConnected, activeBroker, clientId };
};
