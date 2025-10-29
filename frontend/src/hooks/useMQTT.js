import { useEffect, useState } from "react";
import { connectMQTT } from "../lib/mqttConfig.js";

/**
 * Hook untuk koneksi dan update data MQTT secara global.
 * Dapat digunakan di banyak komponen (Hero, Navbar, SensorDetail, dll)
 */
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

  useEffect(() => {
    // Panggil fungsi dari lib/mqttConfig.js
    connectMQTT(
      (incomingData) => setData(incomingData),
      (connected) => setIsConnected(connected)
    );
  }, []);

  return { data, isConnected };
};
