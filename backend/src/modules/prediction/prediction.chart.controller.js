import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

function formatTime(ts) {
  const d = new Date(ts);
  return d.toTimeString().slice(0, 5);
}

export async function getPredictionChart(req, res, next) {
  try {
    const { type } = req.params; // "temperature" | "tvoc"

    // 1. Historical ACTUAL data
    const sensorRows = await prisma.sensordata.findMany({
      orderBy: { id: "desc" },
      take: 48,
    });

    const actual = sensorRows.reverse().map((row) => ({
      time: formatTime(row.createdAt),
      value: type === "temperature" ? row.temperature : row.tvoc,
      type: "actual",
    }));

    // 2. Latest prediction
    const latest = await prisma.prediction.findFirst({
      orderBy: { id: "desc" },
    });

    let predicted = [];

    if (latest) {
      const forecast = latest.forecastJson;

      const pairs = Object.entries(forecast).filter(([key]) =>
        type === "temperature" ? key.includes("temp") : key.includes("tvoc")
      );

      predicted = pairs.map(([key, val], index) => ({
        time: `+${index + 1}`,
        value: val,
        type: "predicted",
      }));
    }

    return res.json({
      success: true,
      data: [...actual, ...predicted],
    });
  } catch (err) {
    next(err);
  }
}
