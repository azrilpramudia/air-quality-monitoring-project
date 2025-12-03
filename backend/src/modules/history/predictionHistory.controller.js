import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function getPredictionHistory(req, res, next) {
  try {
    const limit = Number(req.query.limit) || 100;

    const data = await prisma.prediction.findMany({
      orderBy: { id: "desc" },
      take: limit,
    });

    return res.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (err) {
    next(err);
  }
}
