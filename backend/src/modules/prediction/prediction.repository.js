import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * Save prediction to DB
 */
export async function savePrediction(params) {
  const { timestamp, sensors, features, prediction, target_cols } = params;

  // -----------------------------
  // 1. Safe timestamp handling
  // -----------------------------
  let ts = timestamp ? new Date(timestamp) : new Date();
  if (isNaN(ts.getTime())) {
    console.warn("⚠️ Invalid timestamp detected, using now()");
    ts = new Date();
  }

  // -----------------------------
  // 2. Validate prediction length
  // -----------------------------
  if (!Array.isArray(prediction) || !Array.isArray(target_cols)) {
    throw new Error("Prediction or target_cols is not an array");
  }

  if (prediction.length !== target_cols.length) {
    console.error("❌ Prediction length mismatch:", {
      predictions: prediction.length,
      target_cols: target_cols.length,
    });
    throw new Error("Prediction array does not match target_cols length");
  }

  // -----------------------------
  // 3. Build forecast JSON
  // -----------------------------
  const forecast = {};
  for (let i = 0; i < target_cols.length; i++) {
    forecast[target_cols[i]] = prediction[i];
  }

  // -----------------------------
  // 4. Sanitize sensors
  // -----------------------------
  const safeSensors = {
    temp_c: Number(sensors?.temp_c) || 0,
    rh_pct: Number(sensors?.rh_pct) || 0,
    tvoc_ppb: Number(sensors?.tvoc_ppb) || 0,
    eco2_ppm: Number(sensors?.eco2_ppm) || 0,
    dust_ugm3: Number(sensors?.dust_ugm3) || 0,
  };

  // -----------------------------
  // 5. Insert into DB
  // -----------------------------
  return prisma.prediction.create({
    data: {
      timestamp: ts,
      ...safeSensors,
      featuresJson: {
        values: features ?? [],
      },
      forecastJson: forecast,
    },
  });
}
