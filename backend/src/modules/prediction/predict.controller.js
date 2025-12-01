import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

function generatePrediction(base, startTime, hours) {
  const predicted = [];
  for (let i = 1; i <= hours; i++) {
    const t = new Date(startTime.getTime() + i * 60 * 60 * 1000);

    predicted.push({
      time: t.toTimeString().slice(0, 5),
      value: base + Math.sin((i / hours) * Math.PI * 2) * 3,
      type: "predicted",
      timestamp: t,
    });
  }
  return predicted;
}

export const getPrediction = async (req, res) => {
  try {
    const type = req.params.type;

    if (!["temperature", "tvoc"].includes(type)) {
      return res.status(400).json({ error: "Unknown prediction type" });
    }

    const latest = await prisma.sensorData.findFirst({
      orderBy: { createdAt: "desc" },
    });

    if (!latest) return res.status(404).json({ error: "No data available" });

    const baseValue = type === "temperature" ? latest.temperature : latest.tvoc;

    const prevTime = new Date(latest.createdAt - 60 * 60 * 1000);

    const historical = [
      {
        time: prevTime.toTimeString().slice(0, 5),
        value: baseValue - 1,
        type: "actual",
      },
      {
        time: latest.createdAt.toTimeString().slice(0, 5),
        value: baseValue,
        type: "actual",
      },
    ];

    const predicted = generatePrediction(baseValue, latest.createdAt, 24);

    res.json({ data: [...historical, ...predicted] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Prediction failed" });
  }
};

// ===============================================================
// 2. CUSTOM RANGE PREDICTION
// ===============================================================

export const getPredictedRange = async (req, res) => {
  try {
    const type = req.params.type;
    const hours = parseInt(req.query.hours || "24");

    if (!["temperature", "tvoc"].includes(type))
      return res.status(400).json({ error: "Unknown prediction type" });

    if (hours < 1 || hours > 240)
      return res
        .status(400)
        .json({ error: "Range hours must be between 1–240" });

    const latest = await prisma.sensorData.findFirst({
      orderBy: { createdAt: "desc" },
    });

    const base = type === "temperature" ? latest.temperature : latest.tvoc;

    const predicted = generatePrediction(base, latest.createdAt, hours);

    res.json({ data: predicted });
  } catch (err) {
    res.status(500).json({ error: "Range prediction failed" });
  }
};

// ===============================================================
// 3. TODAY PREDICTION (00:00 – 23:59)
// ===============================================================

export const getPredictionToday = async (req, res) => {
  try {
    const type = req.params.type;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const latest = await prisma.sensorData.findFirst({
      orderBy: { createdAt: "desc" },
    });

    const base = type === "temperature" ? latest.temperature : latest.tvoc;

    const predicted = generatePrediction(base, todayStart, 24);

    res.json({ data: predicted });
  } catch (err) {
    res.status(500).json({ error: "Prediction today failed" });
  }
};

// ===============================================================
// 4. PREDIKSI 7 HARI KE DEPAN
// ===============================================================

export const getPrediction7Days = async (req, res) => {
  try {
    const type = req.params.type;

    const latest = await prisma.sensorData.findFirst({
      orderBy: { createdAt: "desc" },
    });

    const base = type === "temperature" ? latest.temperature : latest.tvoc;

    const predicted = generatePrediction(base, latest.createdAt, 24 * 7);

    res.json({ data: predicted });
  } catch (err) {
    res.status(500).json({ error: "Prediction 7 days failed" });
  }
};

// ===============================================================
// 5. HISTORY PREDICTED (ambil dari database prediction table)
// ===============================================================

export const getPredictionHistory = async (req, res) => {
  try {
    const type = req.params.type;

    const result = await prisma.predictionData.findMany({
      where: { type },
      orderBy: { timestamp: "asc" },
    });

    res.json({ data: result });
  } catch (err) {
    res.status(500).json({ error: "History fetch failed" });
  }
};
