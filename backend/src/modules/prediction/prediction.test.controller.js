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

    // Validate required fields
    const required = { temp_c, rh_pct, tvoc_ppb, eco2_ppm, dust_ugm3 };
    for (const key in required) {
      if (required[key] === undefined) {
        return res.status(400).json({
          success: false,
          error: `Missing required field: ${key}`,
        });
      }
    }

    // Insert into DB
    const result = await prisma.prediction.create({
      data: {
        timestamp: timestamp ? new Date(timestamp) : new Date(),
        temp_c,
        rh_pct,
        tvoc_ppb,
        eco2_ppm,
        dust_ugm3,
        featuresJson,
        forecastJson,
      },
    });

    return res.json({
      success: true,
      message: "Manual prediction inserted!",
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
