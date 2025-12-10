import { PrismaClient } from "@prisma/client";
import { mlOnline } from "./predict.service.js";

const prisma = new PrismaClient();

function formatTime(ts) {
  const d = new Date(ts);
  return d.toTimeString().slice(0, 5);
}

export async function getPredictionChart(req, res, next) {
  try {
    const { type } = req.params; // temperature | tvoc

    // 1. Get historical actual sensor data
    const sensorRows = await prisma.sensordata.findMany({
      orderBy: { id: "desc" },
      take: 48,
    });

    const actual = sensorRows.reverse().map((row) => ({
      time: formatTime(row.createdAt),
      value: type === "temperature" ? row.temperature : row.tvoc,
      type: "actual",
    }));

    // 2. Latest prediction (may be null)
    const latest = await prisma.prediction.findFirst({
      orderBy: { id: "desc" },
    });

    let predicted = [];

    if (latest?.forecastJson) {
      const forecast = latest.forecastJson;

      const pairs = Object.entries(forecast).filter(([key]) => {
        const k = key.toLowerCase();
        return type === "temperature" ? k.includes("temp") : k.includes("tvoc");
      });

      predicted = pairs.map(([key, val], i) => ({
        time: `+${i + 1}`,
        value: val,
        type: "predicted",
      }));
    }

    // 👇 ML STATUS INCLUDED HERE
    return res.json({
      success: true,
      mlOnline,
      data: [...actual, ...predicted],
    });
  } catch (err) {
    console.error("Chart error:", err);
    return res.json({
      success: false,
      mlOnline: false,
      data: [],
      error: err.message,
    });
  }
}
