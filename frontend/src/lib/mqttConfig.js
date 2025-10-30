import mqtt from "mqtt";

const topic = import.meta.env.VITE_MQTT_TOPIC || "air/quality";

const BROKER_LIST = [
  "wss://broker.hivemq.com:8884/mqtt", // HTTPS secure
  "wss://broker.emqx.io:8084/mqtt",    // EMQX secure
  "wss://mqtt.eclipseprojects.io/mqtt", // Fallback Eclipse
  "ws://localhost:9001",                // Local Mosquitto
];

/**
 * Auto detect protokol (http/https)
 * Kalau di localhost pakai ws://
 */
const getBrokerURL = () => {
  const envBroker = import.meta.env.VITE_MQTT_URL;
  if (envBroker) return envBroker;

  const isHttps = window.location.protocol === "https:";
  return isHttps ? BROKER_LIST[0] : "ws://broker.hivemq.com:8000/mqtt";
};

let currentBrokerIndex = 0;

/**
 * Fungsi utama untuk koneksi MQTT
 * @returns {mqtt.MqttClient} client instance untuk cleanup
 */
export const connectMQTT = (onMessageCallback, onConnectionChange) => {
  let client = null;

  const tryConnect = (brokerUrl) => {
    console.log(`🔌 Connecting to broker: ${brokerUrl}`);

    client = mqtt.connect(brokerUrl, {
      clientId: "ReactClient_" + Math.random().toString(16).substring(2, 8),
      reconnectPeriod: 3000,
      connectTimeout: 4000,
      clean: true,
    });

    // === On Connected ===
    client.on("connect", () => {
      console.log(`✅ Connected to MQTT Broker: ${brokerUrl}`);
      onConnectionChange?.(true);

      client.subscribe(topic, (err) => {
        if (err) console.error("❌ Failed to subscribe:", err.message);
        else console.log("📡 Subscribed to:", topic);
      });
    });

    // === On Message ===
    client.on("message", (receivedTopic, message) => {
      if (receivedTopic === topic) {
        try {
          const data = JSON.parse(message.toString());
          onMessageCallback?.(data);
        } catch {
          console.error("⚠️ Invalid JSON from broker:", message.toString());
        }
      }
    });

    // === On Reconnect ===
    client.on("reconnect", () => {
      console.warn("🔁 Reconnecting to broker...");
      onConnectionChange?.(false);
    });

    // === On Error ===
    client.on("error", (err) => {
      console.error("🚨 MQTT Error:", err.message || err);
      onConnectionChange?.(false);
    });

    // === On Close (retry logic) ===
    client.on("close", () => {
      console.warn("⚠️ Disconnected from broker:", brokerUrl);
      onConnectionChange?.(false);

      if (currentBrokerIndex < BROKER_LIST.length - 1) {
        currentBrokerIndex++;
        const nextBroker = BROKER_LIST[currentBrokerIndex];
        console.log(`⏳ Retrying with next broker: ${nextBroker}`);
        setTimeout(() => tryConnect(nextBroker), 2000);
      } else {
        console.error("❌ All MQTT brokers failed to connect.");
      }
    });

    return client;
  };

  const initialBroker = getBrokerURL();
  return tryConnect(initialBroker);
};
