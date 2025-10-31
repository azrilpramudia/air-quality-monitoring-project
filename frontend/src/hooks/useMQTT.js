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

  useEffect(() => {
    const client = connectMQTT(
      (incomingData) => setData(incomingData),
      (connected) => setIsConnected(connected),
      (broker) => setActiveBroker(broker)
    );

    return () => client?.end();
  }, []);

  return { data, isConnected, activeBroker };
};
