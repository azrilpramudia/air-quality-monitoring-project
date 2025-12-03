import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * predictionData:
 * {
 *   timestamp,
 *   sensors: { temp_c, rh_pct, tvoc_ppb, eco2_ppm, dust_ugm3 },
 *   features: number[],
 *   prediction: number[],
 *   target_cols: string[]
 * }
 */
export async function savePrediction(predictionData) {
  const { timestamp, sensors, features, prediction, target_cols } =
    predictionData;

  // Map outputs into an object: { "y_temp+1": value, ... }
  const forecast = {};
  target_cols.forEach((name, i) => {
    forecast[name] = prediction[i];
  });

  return prisma.prediction.create({
    data: {
      timestamp: new Date(timestamp || Date.now()),
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
