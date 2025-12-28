import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * GET /api/history/:sensorType?hours=24|168|720
 */
export async function getSensorHistory(req, res) {
  try {
    const { sensorType } = req.params;
    const hours = Number(req.query.hours) || 24;

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

    // ⏳ gunakan SENSOR TIMESTAMP
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const rows = await prisma.actual.findMany({
      where: {
        ts: { gte: since },
      },
      orderBy: { ts: "asc" },
      select: {
        ts: true,
        [sensorType]: true,
      },
    });

    const formatted = rows
      .map((row) => {
        const value = row[sensorType];
        if (typeof value !== "number") return null;

        return {
          date: row.ts.toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
          }),
          time: row.ts.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          value,
        };
      })
      .filter(Boolean); // 🚨 penting

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
