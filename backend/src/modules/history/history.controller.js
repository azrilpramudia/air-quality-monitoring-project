import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * GET /api/history/:sensorType?hours=24|168|720
 *
 * sensorType = temperature | humidity | tvoc | eco2 | dust | aqi
 * hours = how many hours back
 */

export async function getSensorHistory(req, res) {
  try {
    const { sensorType } = req.params;
    const hours = Number(req.query.hours) || 24;

    // 🚨 Validate sensor type
    const validCols = [
      "temperature",
      "humidity",
      "tvoc",
      "eco2",
      "dust",
      "aqi",
    ];
    if (!validCols.includes(sensorType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid sensor type: ${sensorType}`,
      });
    }

    // ⏳ Time range (N hours back from now)
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    // Query DB
    const rows = await prisma.sensordata.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "asc" },
      select: {
        createdAt: true,
        [sensorType]: true,
      },
    });

    // Format for frontend
    const formatted = rows.map((row) => ({
      date: row.createdAt.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
      }),
      time: row.createdAt.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      value: row[sensorType],
    }));

    return res.json({
      success: true,
      data: formatted,
    });
  } catch (err) {
    console.error("❌ History error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}
