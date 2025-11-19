import prisma from "../../config/prisma.js";

export const getAllSensorData = async (req, res) => {
  try {
    const data = await prisma.sensorData.findMany({
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      status: "success",
      count: data.length,
      data,
    });
  } catch (err) {
    console.error("❌ Error fetching data:", err);
    return res.status(500).json({
      status: "error",
      message: "Internal Server Error",
    });
  }
};
