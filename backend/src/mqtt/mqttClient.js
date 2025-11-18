import mqtt from "mqtt";

const mqttUrl = process.env.MQTT_URL;
const mqttClient = mqtt.connect(mqttUrl, {
  username: process.env.MQTT_USERNAME || undefined,
  password: process.env.MQTT_PASSWORD || undefined,
});

mqttClient.on("connect", () => {
  console.log("🔥 MQTT Connected");

  const topic = process.env.MQTT_TOPIC;
  mqttClient.subscribe(topic, (err) => {
    if (err) console.error("MQTT Subscribe Error:", err);
    else console.log(`📡 Subscribed to topic: ${topic}`);
  });
});

mqttClient.on("error", (err) => {
  console.error("MQTT Error:", err);
});

export default mqttClient;
