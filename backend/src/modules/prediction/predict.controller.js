import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const getPrediction = async (req, res) => {
  try {
    const type = req.params.type;

    if (!["temperature", "tvoc"].includes(type)) {
      return res.status(400).json({ error: "Unknown prediction type" });
    }

    // Ambil data terakhir dari DB
    const latest = await prisma.sensorData.findFirst({
      orderBy: { createdAt: "desc" },
    });

    if (!latest) {
      return res.status(404).json({ error: "No sensor data available" });
    }

    // ============ FALLBACK (Model belum ready) ============
    const base = type === "temperature" ? latest.temperature : latest.tvoc;

    const placeholder = [];
    for (let i = 0; i < 24; i++) {
      placeholder.push({
        time: `${String(i).padStart(2, "0")}:00`,
        value: base + Math.sin((i / 24) * Math.PI * 2) * 2,
        type: "predicted",
      });
    }

    return res.json({ data: placeholder });
  } catch (err) {
    console.error("Prediction controller error:", err);
    res.status(500).json({ error: "Prediction failed" });
  }
};
