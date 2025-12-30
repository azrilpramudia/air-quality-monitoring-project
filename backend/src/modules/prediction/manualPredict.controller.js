import axios from "axios";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:8500";

export async function manualPredict(req, res) {
  try {
    const { deviceId = "esp32-01-client-io" } = req.body;

    // 1️⃣ Ambil data sensor terakhir dari DB
    const last = await prisma.actual.findFirst({
      where: { deviceId },
      orderBy: { createdAt: "desc" },
    });

    if (!last) {
      return res.status(404).json({
        success: false,
        message: "No sensor data found",
      });
    }

    // 2️⃣ KIRIM KE ML TANPA BUILD FEATURE
    const mlRes = await axios.post(`${ML_SERVICE_URL}/predict`, {
      device_id: deviceId,
      lookback_hours: 24,
    });

    return res.json({
      success: true,
      actual: last,
      prediction: mlRes.data,
    });
  } catch (err) {
    console.error("Manual predict error:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
}
