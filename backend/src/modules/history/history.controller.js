// src/modules/history/history.controller.js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const getHistory = async (req, res) => {
  try {
    const { type } = req.params;
    const hours = parseInt(req.query.hours || "24", 10); // default 24 jam

    // Validasi tipe sensor
    if (
      !["temperature", "humidity", "tvoc", "eco2", "dust", "aqi"].includes(type)
    ) {
      return res.status(400).json({ error: "Invalid sensor type" });
    }

    // Batas waktu
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    // Ambil data dari database
    const data = await prisma.sensorData.findMany({
      where: {
        createdAt: { gte: since },
      },
      orderBy: { createdAt: "asc" },
    });

    // Map data ke format frontend
    const formatted = data.map((d) => ({
      timestamp: d.createdAt,
      time: d.createdAt.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      date: d.createdAt.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
      }),
      value: d[type], // dynamic field: temperature, humidity, etc.
    }));

    return res.json({ type, hours, data: formatted });
  } catch (err) {
    console.error("History error:", err);
    res.status(500).json({ error: "Failed to fetch history" });
  }
};
