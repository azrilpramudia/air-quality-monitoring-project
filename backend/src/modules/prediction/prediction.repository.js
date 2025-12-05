import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * Save prediction to DB
 *
 * params:
 * {
 *   timestamp: number | string | Date,
 *   sensors: { temp_c, rh_pct, tvoc_ppb, eco2_ppm, dust_ugm3 },
 *   features: number[],
 *   prediction: number[],
 *   target_cols: string[]
 * }
 */
export async function savePrediction(params) {
  const { timestamp, sensors, features, prediction, target_cols } = params;

  // Ensure timestamp is always valid
  const ts = timestamp ? new Date(timestamp) : new Date();
  if (isNaN(ts)) {
    console.warn("⚠️ Invalid timestamp detected, replacing with now()");
    ts = new Date();
  }

  // Validation: ensure prediction length matches target_cols length
  if (prediction.length !== target_cols.length) {
    console.error("❌ Prediction length mismatch:", {
      predictions: prediction.length,
      target_cols: target_cols.length,
    });
    throw new Error("Prediction array does not match target_cols length");
  }

  // Create forecast mapping: { "y_temp+1": 23.4, ... }
  const forecast = {};
  for (let i = 0; i < target_cols.length; i++) {
    forecast[target_cols[i]] = prediction[i];
  }

  // Validate sensors structure
  const safeSensors = {
    temp_c: sensors.temp_c ?? 0,
    rh_pct: sensors.rh_pct ?? 0,
    tvoc_ppb: sensors.tvoc_ppb ?? 0,
    eco2_ppm: sensors.eco2_ppm ?? 0,
    dust_ugm3: sensors.dust_ugm3 ?? 0,
  };

  // Insert into DB
  return prisma.prediction.create({
    data: {
      timestamp: ts,
      ...safeSensors,
      featuresJson: features,
      forecastJson: forecast,
    },
  });
}
