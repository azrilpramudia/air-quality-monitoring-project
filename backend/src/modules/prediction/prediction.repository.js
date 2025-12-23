import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * Save ML prediction (FORECAST-BASED)
 */
export async function savePrediction({
  device_id,
  generated_at,
  forecast,
  meta = {},
}) {
  if (!device_id) throw new Error("device_id is required");
  if (!Array.isArray(forecast)) throw new Error("forecast must be an array");

  const ts = generated_at ? new Date(generated_at) : new Date();

  return prisma.prediction.create({
    data: {
      deviceId: device_id,
      timestamp: ts,
      generatedAt: ts,
      forecastJson: forecast,
      metaJson: meta,

      modelVersion: meta.model_version ?? "xgb_hourly_v1",
    },
  });
}
