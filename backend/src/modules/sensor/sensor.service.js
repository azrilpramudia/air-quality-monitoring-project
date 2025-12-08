import prisma from "../../config/prisma.js";

export const getAllSensorDataService = async () => {
  return await prisma.sensordata.findMany({
    orderBy: { createdAt: "desc" },
  });
};

export const deleteAllSensorDataService = async () => {
  return await prisma.sensordata.deleteMany({});
};
