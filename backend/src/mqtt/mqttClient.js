import mqtt from "mqtt";
import { broadcastWS } from "../websocket/wsServer.js";

const mqttUrl = process.env.MQTT_URL;

const mqttClient = mqtt.connect(mqttUrl, {
  protocolVersion: 4,
  family: 4, // force IPv4
  username: process.env.MQTT_USERNAME || undefined,
  password: process.env.MQTT_PASSWORD || undefined,
});

mqttClient.on("connect", () => {
  console.log("🔥 MQTT Connected to:", mqttUrl);

  mqttClient.subscribe(process.env.MQTT_TOPIC, (err) => {
    if (err) console.error("MQTT Subscribe Error:", err);
    else console.log("📡 Subscribed:", process.env.MQTT_TOPIC);
  });
});

// ⭐ ON NEW MQTT MESSAGE → SEND TO WS CLIENTS
mqttClient.on("message", (topic, message) => {
  try {
    const data = JSON.parse(message.toString());
    console.log("📥 MQTT Data:", data);

    broadcastWS({
      event: "sensor_update",
      topic,
      data,
    });
  } catch (err) {
    console.error("MQTT Parse Error:", err);
  }
});

mqttClient.on("error", (err) => console.error("MQTT Error:", err));

export default mqttClient;
