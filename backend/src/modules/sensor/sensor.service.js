import prisma from "../../config/prisma.js";

export const getAllSensorDataService = async () => {
  return await prisma.sensorData.findMany({
    orderBy: { createdAt: "desc" },
  });
};
