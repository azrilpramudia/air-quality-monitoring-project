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
        console.log("📥 Raw ESP32 data:", incomingData);
        
        // ✅ MAP ESP32 field names to your app's field names
        const mappedData = {
          aqi: incomingData.aqi ?? calculateAQI(incomingData) ?? 0,
          temperature: incomingData.temp_c ?? incomingData.temperature ?? 0,
          humidity: incomingData.rh_pct ?? incomingData.humidity ?? 0,
          tvoc: incomingData.tvoc_ppb ?? incomingData.tvoc ?? 0,
          eco2: incomingData.eco2_ppm ?? incomingData.eco2 ?? 0,
          dust: incomingData.m ?? incomingData.dust ?? 0,
        };
        
        console.log("✅ Mapped data:", mappedData);
        setData(mappedData);
        pushLog(`📊 Data updated: Temp ${mappedData.temperature.toFixed(1)}°C`);
      },
      (connected) => {
        console.log("🔌 Connection status:", connected);
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

  return { 
    data, 
    connected: isConnected,
    isConnected,
    activeBroker, 
    clientId, 
    log 
  };
};

// ✅ Simple AQI calculation based on TVOC and eCO2
function calculateAQI(data) {
  const tvoc = data.tvoc_ppb || 0;
  const eco2 = data.eco2_ppm || 0;
  const dust = data.m || 0;
  
  // Simple AQI calculation (0-5 scale)
  if (tvoc > 2000 || eco2 > 2000 || dust > 150) return 5; // Very Unhealthy
  if (tvoc > 1000 || eco2 > 1500 || dust > 100) return 4; // Unhealthy
  if (tvoc > 500 || eco2 > 1000 || dust > 50) return 3;   // Moderate
  if (tvoc > 250 || eco2 > 800 || dust > 35) return 2;    // Good
  return 1; // Excellent
}