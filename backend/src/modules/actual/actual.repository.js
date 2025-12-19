// src/modules/actual/actual.repository.js
import prisma from "../../config/prisma.js";

/**
 * Save actual sensor data to database
 */
export async function saveActualData(data) {
  return prisma.actual.create({
    data: {
      deviceId: data.deviceId, // ✅ Prisma field
      ts: data.ts, // ✅ REQUIRED (sensor timestamp)
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
 * Get latest actual data for a device (anti-overload)
 */
export async function getLatestActualData(deviceId) {
  return prisma.actual.findFirst({
    where: { deviceId }, // ✅ FIXED
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get historical data (for ML lookback)
 */
export async function getActualHistory(deviceId, limit = 200) {
  return prisma.actual.findMany({
    where: { deviceId }, // ✅ FIXED
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
