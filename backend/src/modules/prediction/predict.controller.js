import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const getPrediction = async (req, res) => {
  try {
    const type = req.params.type;

    // hanya 2 tipe yg valid
    if (!["temperature", "tvoc"].includes(type)) {
      return res.status(400).json({ error: "Unknown prediction type" });
    }

    // ===== 1. GET LAST ACTUAL SENSOR DATA =====
    const latest = await prisma.sensorData.findFirst({
      orderBy: { createdAt: "desc" },
    });

    if (!latest) {
      return res.status(404).json({ error: "No sensor data available" });
    }

    const baseValue = type === "temperature" ? latest.temperature : latest.tvoc;

    // ===== 2. HISTORICAL (2 titik agar garis nyambung) =====
    const prevTime = new Date(latest.createdAt.getTime() - 60 * 60 * 1000);

    const historical = [
      {
        time: prevTime.toTimeString().slice(0, 5),
        value: baseValue - 1, // sedikit variasi
        type: "actual",
      },
      {
        time: latest.createdAt.toTimeString().slice(0, 5),
        value: baseValue,
        type: "actual",
      },
    ];

    // ===== 3. PREDIKSI 24 JAM (1 jam sekali) =====
    const predicted = [];

    for (let i = 1; i <= 24; i++) {
      const future = new Date(latest.createdAt.getTime() + i * 60 * 60 * 1000);

      predicted.push({
        time: future.toTimeString().slice(0, 5),
        value: baseValue + Math.sin((i / 24) * Math.PI * 2) * 3,
        type: "predicted",
      });
    }

    // ===== 4. COMBINE =====
    const combined = [...historical, ...predicted];

    return res.json({ data: combined });
  } catch (err) {
    console.error("Prediction controller error:", err);
    res.status(500).json({ error: "Prediction failed" });
  }
};
