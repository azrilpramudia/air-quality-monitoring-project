import mqttClient from "./mqttClient.js";
import prisma from "../config/prisma.js";
import { broadcastWS } from "../websocket/wsServer.js";

mqttClient.on("message", async (topic, message) => {
  try {
    const payload = JSON.parse(message.toString());
    console.log("📥 MQTT Incoming:", payload);

    // Save data to DB
    const record = await prisma.sensorData.create({
      data: {
        type: payload.type,
        value: payload.value,
      },
    });

    // Send to WebSocket clients
    broadcastWS({
      event: "sensor_update",
      data: record,
    });

  } catch (err) {
    console.error("❌ MQTT Message Handler Error:", err);
  }
});
