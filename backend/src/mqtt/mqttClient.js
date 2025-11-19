import mqtt from "mqtt";

const mqttUrl = process.env.MQTT_URL;

const mqttClient = mqtt.connect(mqttUrl, {
  username: process.env.MQTT_USERNAME || undefined,
  password: process.env.MQTT_PASSWORD || undefined,
  protocolVersion: 4,     // MQTT v3.1.1 (most stable)
  family: 4               // Force IPv4 (avoid IPv6 timeout errors)
});

// When connected
mqttClient.on("connect", () => {
  console.log("🔥 MQTT Connected to:", mqttUrl);

  const topic = process.env.MQTT_TOPIC;
  mqttClient.subscribe(topic, (err) => {
    if (err) {
      console.error("❌ MQTT Subscribe Error:", err);
    } else {
      console.log("📡 Subscribed to topic:", topic);
    }
  });
});

// Error handler
mqttClient.on("error", (err) => {
  console.error("MQTT Error:", err);
});

export default mqttClient;
