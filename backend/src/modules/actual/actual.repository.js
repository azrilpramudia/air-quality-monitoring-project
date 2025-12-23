import prisma from "../../config/prisma.js";

/**
 * Save actual sensor data to database
 */
export async function saveActualData(data) {
  return prisma.actual.create({
    data: {
      deviceId: data.deviceId,
      ts: data.ts,
      temperature: data.temperature,
      humidity: data.humidity,
      tvoc: data.tvoc,
      eco2: data.eco2,
      dust: data.dust,
      aqi: data.aqi ?? null,
      createdAt: data.createdAt ?? new Date(),
    },
  });
}

/**
 * Get latest actual data for a device
 */
export async function getLatestActualData(deviceId) {
  return prisma.actual.findFirst({
    where: { deviceId },
    orderBy: { ts: "desc" }, // 🔥 lebih benar pakai ts sensor
  });
}

/**
 * Find duplicate by deviceId + ts
 */
export async function findActualByDeviceAndTs(deviceId, ts) {
  return prisma.actual.findFirst({
    where: {
      deviceId,
      ts,
    },
  });
}

/**
 * Get historical data (for ML lookback)
 */
export async function getActualHistory(deviceId, limit = 200) {
  return prisma.actual.findMany({
    where: { deviceId },
    orderBy: { ts: "desc" },
    take: limit,
  });
}
