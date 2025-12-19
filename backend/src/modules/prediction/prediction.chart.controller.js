import { PrismaClient } from "@prisma/client";
import { mlOnline } from "./predict.service.js";

const prisma = new PrismaClient();

/**
 * Format time for chart label (HH:mm)
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
    // 1. ACTUAL DATA (last 48 points)
    // ======================================================
    const actualRows = await prisma.actual.findMany({
      orderBy: { createdAt: "desc" },
      take: 48,
    });

    const actual = actualRows.reverse().map((row) => ({
      time: formatTime(row.createdAt),
      value: type === "temperature" ? row.temperature : row.tvoc,
      type: "actual",
    }));

    // ======================================================
    // 2. LATEST PREDICTION
    // ======================================================
    const latestPrediction = await prisma.prediction.findFirst({
      orderBy: { createdAt: "desc" },
    });

    let predicted = [];

    /**
     * Expected forecastJson format:
     * {
     *   forecast: [
     *     { ts: "2025-12-19T11:00:00Z", temp_c: 30.2, tvoc_ppb: 1200 },
     *     ...
     *   ]
     * }
     */
    if (
      latestPrediction?.forecastJson &&
      Array.isArray(latestPrediction.forecastJson.forecast)
    ) {
      predicted = latestPrediction.forecastJson.forecast.map((item) => ({
        time: formatTime(item.ts),
        value: type === "temperature" ? item.temp_c : item.tvoc_ppb,
        type: "predicted",
      }));
    }

    // ======================================================
    // 3. RESPONSE
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
