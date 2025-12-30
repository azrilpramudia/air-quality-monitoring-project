import { PrismaClient } from "@prisma/client";
import { mlOnline } from "../ml/predict.service.js";

const prisma = new PrismaClient();

/**
 * Format time HH:mm
 */
function formatTime(ts) {
  const d = new Date(ts);
  return d.toTimeString().slice(0, 5);
}

/**
 * GET /api/chart/:type
 * type = temperature | tvoc
 */
export async function getPredictionChart(req, res) {
  try {
    const { type } = req.params;

    if (!["temperature", "tvoc"].includes(type)) {
      return res.status(400).json({
        success: false,
        error: "Invalid chart type",
      });
    }

    // ======================================================
    // 1️⃣ ACTUAL DATA — 1 JAM TERAKHIR (60 POINTS)
    // ======================================================
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const actualRows = await prisma.actual.findMany({
      where: {
        ts: { gte: oneHourAgo },
      },
      orderBy: { ts: "asc" },
    });

    const actual = actualRows.map((row) => ({
      time: formatTime(row.ts), // ✅ pakai timestamp sensor
      value: type === "temperature" ? row.temperature : row.tvoc,
      type: "actual",
    }));

    // ======================================================
    // 2️⃣ PREDICTION — 1 JAM KE DEPAN
    // ======================================================
    const latestPrediction = await prisma.prediction.findFirst({
      orderBy: { timestamp: "desc" },
    });

    let predicted = [];

    if (
      latestPrediction?.forecastJson &&
      Array.isArray(latestPrediction.forecastJson.prediction)
    ) {
      const forecast = latestPrediction.forecastJson.prediction;

      // mulai dari timestamp prediction
      let baseTime = new Date(latestPrediction.timestamp);

      predicted = forecast.slice(0, 60).map((value, i) => {
        const ts = new Date(baseTime.getTime() + (i + 1) * 60 * 1000);

        return {
          time: formatTime(ts), // ⏱️ jam real
          value: Number(value.toFixed(2)), // ✅ angka valid
          type: "predicted",
        };
      });
    }

    // ======================================================
    // 3️⃣ RESPONSE
    // ======================================================
    return res.json({
      success: true,
      mlOnline,
      data: [...actual, ...predicted],
    });
  } catch (err) {
    console.error("❌ Prediction chart error:", err);

    return res.status(500).json({
      success: false,
      mlOnline: false,
      data: [],
      error: err.message,
    });
  }
}
