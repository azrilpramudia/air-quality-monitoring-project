import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/predict/latest
export async function getLatestPrediction(req, res, next) {
  try {
    const latest = await prisma.prediction.findFirst({
      orderBy: { id: "desc" },
    });

    if (!latest) {
      return res.status(404).json({
        success: false,
        message: "No prediction data found",
      });
    }

    return res.json({
      success: true,
      data: latest,
    });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/predict/delete-all (DEV only)
export async function deleteAllPredictions(req, res, next) {
  try {
    const deleted = await prisma.prediction.deleteMany({});

    return res.json({
      success: true,
      message: "All prediction records deleted",
      deletedCount: deleted.count,
    });
  } catch (err) {
    next(err);
  }
}
