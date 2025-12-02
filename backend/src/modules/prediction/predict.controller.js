import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * ======================================================
 * CONFIG PREDIKSI PER TIPE DATA
 * ======================================================
 */
function getPredictionConfig(type) {
  if (type === "temperature") {
    return {
      min: 18, // batas bawah suhu
      max: 40, // batas atas suhu
      seasonalAmp: 3.5, // amplitudo gelombang harian
      noiseStep: 0.25, // besarnya langkah random walk
      trendPerDay: 0.4, // perubahan max per 24 jam (derajat)
    };
  }

  if (type === "tvoc") {
    return {
      min: 100, // ppb
      max: 2000, // ppb
      seasonalAmp: 120, // gelombang harian TVOC
      noiseStep: 20, // random walk step
      trendPerDay: 80, // perubahan max per 24 jam (ppb)
    };
  }

  // default fallback (kalau nanti nambah tipe lain)
  return {
    min: 0,
    max: 1000,
    seasonalAmp: 1,
    noiseStep: 1,
    trendPerDay: 0,
  };
}

/**
 * ======================================================
 * AI Prediction v2:
 * - Trend + Seasonal + Random Walk + Clamp
 * ======================================================
 *
 * base      : nilai baseline (dari sensor terakhir)
 * startTime : Date mulai prediksi
 * hours     : jumlah jam ke depan
 * type      : "temperature" | "tvoc"
 */
function generatePredictionV2(base, startTime, hours, type) {
  const cfg = getPredictionConfig(type);
  const predicted = [];

  // random walk state
  let randomOffset = 0;

  for (let i = 1; i <= hours; i++) {
    const t = new Date(startTime.getTime() + i * 60 * 60 * 1000);
    const hour = t.getHours();

    // --------------------------
    // 1) Seasonal pattern (harian)
    //    - shift pusat ke sekitar jam 14/15 (puncak panas/polusi)
    // --------------------------
    const phaseShift = -3; // geser 3 jam supaya puncak di sore
    const seasonal =
      Math.sin(((hour + phaseShift) / 24) * Math.PI * 2) * cfg.seasonalAmp;

    // --------------------------
    // 2) Trend pelan per hari
    // --------------------------
    const daysAhead = i / 24;
    const trend =
      cfg.trendPerDay * daysAhead * (Math.random() > 0.5 ? 1 : -1) * 0.5; // ± setengah trend config

    // --------------------------
    // 3) Random walk noise
    //    - small incremental noise supaya natural
    // --------------------------
    const step = (Math.random() - 0.5) * 2 * cfg.noiseStep;
    randomOffset += step;

    // batasi randomOffset supaya nggak kabur terlalu jauh
    const maxRandomRange = cfg.seasonalAmp * 0.8;
    if (randomOffset > maxRandomRange) randomOffset = maxRandomRange;
    if (randomOffset < -maxRandomRange) randomOffset = -maxRandomRange;

    // --------------------------
    // 4) Combine semua komponen
    // --------------------------
    let value = base + seasonal + trend + randomOffset;

    // 5) Clamp ke rentang wajar
    if (value < cfg.min) value = cfg.min;
    if (value > cfg.max) value = cfg.max;

    predicted.push({
      time: t.toTimeString().slice(0, 5),
      value: parseFloat(value.toFixed(2)),
      type: "predicted",
      timestamp: t,
    });
  }

  return predicted;
}

/**
 * =======================================================
 * 1. NORMAL PREDICTION (24 HOURS)
 * =======================================================
 */
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

    // 2 titik historical agar grafik actual tidak putus
    const prevTime = new Date(latest.createdAt.getTime() - 60 * 60 * 1000);

    const historical = [
      {
        time: prevTime.toTimeString().slice(0, 5),
        value: parseFloat((baseValue - 1).toFixed(2)),
        type: "actual",
      },
      {
        time: latest.createdAt.toTimeString().slice(0, 5),
        value: parseFloat(baseValue.toFixed(2)),
        type: "actual",
      },
    ];

    const predicted = generatePredictionV2(
      baseValue,
      latest.createdAt,
      24,
      type
    );

    return res.json({ data: [...historical, ...predicted] });
  } catch (err) {
    console.error("getPrediction error:", err);
    res.status(500).json({ error: "Prediction failed" });
  }
};

/**
 * =======================================================
 * 2. CUSTOM RANGE PREDICTION (?hours)
 *    /ai/prediction-range/:type?hours=48
 * =======================================================
 */
export const getPredictedRange = async (req, res) => {
  try {
    const type = req.params.type;
    const hours = parseInt(req.query.hours || "24", 10);

    if (!["temperature", "tvoc"].includes(type))
      return res.status(400).json({ error: "Unknown prediction type" });

    if (Number.isNaN(hours) || hours < 1 || hours > 240)
      return res
        .status(400)
        .json({ error: "Range hours must be between 1–240" });

    const latest = await prisma.sensorData.findFirst({
      orderBy: { createdAt: "desc" },
    });

    if (!latest)
      return res.status(404).json({ error: "No baseline data available" });

    const base = type === "temperature" ? latest.temperature : latest.tvoc;

    const predicted = generatePredictionV2(base, latest.createdAt, hours, type);

    return res.json({ data: predicted });
  } catch (err) {
    console.error("getPredictedRange error:", err);
    res.status(500).json({ error: "Range prediction failed" });
  }
};

/**
 * =======================================================
 * 3. TODAY PREDICTION (00:00–23:59)
 * =======================================================
 */
export const getPredictionToday = async (req, res) => {
  try {
    const type = req.params.type;

    if (!["temperature", "tvoc"].includes(type))
      return res.status(400).json({ error: "Unknown prediction type" });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const latest = await prisma.sensorData.findFirst({
      orderBy: { createdAt: "desc" },
    });

    if (!latest)
      return res.status(404).json({ error: "No baseline data found" });

    const base = type === "temperature" ? latest.temperature : latest.tvoc;

    const predicted = generatePredictionV2(base, todayStart, 24, type);

    return res.json({ data: predicted });
  } catch (err) {
    console.error("getPredictionToday error:", err);
    res.status(500).json({ error: "Prediction today failed" });
  }
};

/**
 * =======================================================
 * 4. PREDICTION 7 DAYS (24 * 7 HOURS)
 * =======================================================
 */
export const getPrediction7Days = async (req, res) => {
  try {
    const type = req.params.type;

    if (!["temperature", "tvoc"].includes(type))
      return res.status(400).json({ error: "Unknown prediction type" });

    const latest = await prisma.sensorData.findFirst({
      orderBy: { createdAt: "desc" },
    });

    if (!latest)
      return res.status(404).json({ error: "No baseline data found" });

    const base = type === "temperature" ? latest.temperature : latest.tvoc;

    const predicted = generatePredictionV2(
      base,
      latest.createdAt,
      24 * 7,
      type
    );

    return res.json({ data: predicted });
  } catch (err) {
    console.error("getPrediction7Days error:", err);
    res.status(500).json({ error: "Prediction 7 days failed" });
  }
};

/**
 * =======================================================
 * 5. PREDICTION HISTORY (FROM predictionData TABLE)
 * =======================================================
 */
export const getPredictionHistory = async (req, res) => {
  try {
    const type = req.params.type;

    const result = await prisma.predictionData.findMany({
      where: { type },
      orderBy: { timestamp: "asc" },
    });

    return res.json({ data: result });
  } catch (err) {
    console.error("getPredictionHistory error:", err);
    res.status(500).json({ error: "History fetch failed" });
  }
};
