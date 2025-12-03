import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * params:
 * {
 *   timestamp: Date | string | number,
 *   sensors: { temp_c, rh_pct, tvoc_ppb, eco2_ppm, dust_ugm3 },
 *   features: number[],
 *   prediction: number[],
 *   target_cols: string[]
 * }
 */
export async function savePrediction(params) {
  const { timestamp, sensors, features, prediction, target_cols } = params;

  const ts = timestamp ? new Date(timestamp) : new Date();

  // Map outputs into { "y_temp+1": value, ... }
  const forecast = {};
  target_cols.forEach((name, idx) => {
    forecast[name] = prediction[idx];
  });

  return prisma.prediction.create({
    data: {
      timestamp: ts,
      temp_c: sensors.temp_c,
      rh_pct: sensors.rh_pct,
      tvoc_ppb: sensors.tvoc_ppb,
      eco2_ppm: sensors.eco2_ppm,
      dust_ugm3: sensors.dust_ugm3,
      featuresJson: features,
      forecastJson: forecast,
    },
  });
}
