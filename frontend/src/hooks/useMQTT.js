import { useEffect, useState, useRef } from "react";
import { connectMQTT } from "../lib/mqttConfig.js";

/**
 * Hook untuk koneksi dan update data MQTT secara global.
 * Bisa dipakai di Hero, Navbar, SensorDetail, dll.
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

  // Simpan client MQTT di useRef agar tidak reinit tiap render
  const clientRef = useRef(null);

  useEffect(() => {
    // 🚀 Inisialisasi koneksi MQTT
    const client = connectMQTT(
      (incomingData) => setData((prev) => ({ ...prev, ...incomingData })), // merge data
      (connected) => setIsConnected(connected)
    );

    clientRef.current = client;

    // 🧹 Cleanup koneksi saat komponen unmount
    return () => {
      if (clientRef.current && clientRef.current.end) {
        console.log("🧹 Menutup koneksi MQTT...");
        clientRef.current.end(true);
      }
    };
  }, []);

  return { data, isConnected };
};
