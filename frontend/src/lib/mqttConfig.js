/* eslint-disable no-unused-vars */
import mqtt from "mqtt";

const MQTT_BROKER = import.meta.env.VITE_MQTT_URL || "wss://broker.emqx.io:8084/mqtt";
const MQTT_TOPIC = import.meta.env.VITE_MQTT_TOPIC || "air/quality";
const CLIENT_PREFIX = import.meta.env.VITE_MQTT_CLIENT_PREFIX || "react_client_";
const DEBUG = import.meta.env.VITE_MQTT_DEBUG === "true";

let client;

/**
 * 🔌 Connect to MQTT Broker
 */
export const connectMQTT = (onMessage, onConnectionChange, onBrokerChange) => {
  const clientId = CLIENT_PREFIX + Math.random().toString(16).substring(2, 8);

  DEBUG && console.log(`🔌 Connecting to ${MQTT_BROKER} as ${clientId}`);
  onBrokerChange?.(MQTT_BROKER);

  client = mqtt.connect(MQTT_BROKER, {
    clientId,
    reconnectPeriod: 4000, // Reconnect every 4 seconds
    connectTimeout: 5000,
    clean: true,
  });

  client.on("connect", () => {
    DEBUG && console.log(`✅ Connected to ${MQTT_BROKER}`);
    onConnectionChange?.(true);
    client.subscribe(MQTT_TOPIC, (err) => {
      if (err) console.error("❌ Failed to subscribe:", err);
      else DEBUG && console.log(`📡 Subscribed to topic: ${MQTT_TOPIC}`);
    });
  });

  client.on("message", (topic, message) => {
    if (topic === MQTT_TOPIC) {
      try {
        const data = JSON.parse(message.toString());
        onMessage?.(data);
        DEBUG && console.log("📊 Incoming data:", data);
      } catch (err) {
        console.warn("⚠️ Invalid JSON:", message.toString());
      }
    }
  });

  client.on("close", () => {
    console.warn("⚠️ Disconnected from broker:", MQTT_BROKER);
    onConnectionChange?.(false);
  });

  client.on("error", (err) => {
    console.error("🚨 MQTT Error:", err.message);
    onConnectionChange?.(false);
  });

  return client;
};
