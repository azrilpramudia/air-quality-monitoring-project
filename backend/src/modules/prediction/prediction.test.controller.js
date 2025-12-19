import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function testCreatePrediction(req, res, next) {
  try {
    const {
      timestamp,
      temp_c,
      rh_pct,
      tvoc_ppb,
      eco2_ppm,
      dust_ugm3,
      featuresJson = {},
      forecastJson = {},
    } = req.body;

    // -----------------------------
    // 1. Validate required fields
    // -----------------------------
    const required = { temp_c, rh_pct, tvoc_ppb, eco2_ppm, dust_ugm3 };
    for (const key in required) {
      if (required[key] === undefined || required[key] === null) {
        return res.status(400).json({
          success: false,
          error: `Missing required field: ${key}`,
        });
      }
    }

    // -----------------------------
    // 2. Safe timestamp
    // -----------------------------
    let ts = timestamp ? new Date(timestamp) : new Date();
    if (isNaN(ts.getTime())) {
      console.warn("⚠️ Invalid timestamp, using now()");
      ts = new Date();
    }

    // -----------------------------
    // 3. Force numeric values
    // -----------------------------
    const dataNumeric = {
      temp_c: Number(temp_c),
      rh_pct: Number(rh_pct),
      tvoc_ppb: Number(tvoc_ppb),
      eco2_ppm: Number(eco2_ppm),
      dust_ugm3: Number(dust_ugm3),
    };

    for (const key in dataNumeric) {
      if (Number.isNaN(dataNumeric[key])) {
        return res.status(400).json({
          success: false,
          error: `Invalid numeric value for ${key}`,
        });
      }
    }

    // -----------------------------
    // 4. Ensure JSON-safe payloads
    // -----------------------------
    const safeFeatures = JSON.parse(JSON.stringify(featuresJson ?? {}));
    const safeForecast = JSON.parse(JSON.stringify(forecastJson ?? {}));

    // -----------------------------
    // 5. Insert into DB
    // -----------------------------
    const result = await prisma.prediction.create({
      data: {
        timestamp: ts,
        ...dataNumeric,
        featuresJson: safeFeatures,
        forecastJson: safeForecast,
      },
    });

    return res.json({
      success: true,
      message: "Manual prediction inserted!",
      data: result,
    });
  } catch (err) {
    console.error("❌ testCreatePrediction error:", err);
    next(err);
  }
}
