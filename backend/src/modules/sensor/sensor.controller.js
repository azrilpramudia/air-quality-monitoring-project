import { getAllSensorDataService } from "./sensor.service.js";

export const getAllSensorData = async (req, res) => {
  try {
    const data = await getAllSensorDataService();

    return res.status(200).json({
      status: "success",
      count: data.length,
      data,
    });
  } catch (err) {
    console.error("❌ Error fetching sensor data:", err);
    return res.status(500).json({
      status: "error",
      message: "Internal Server Error",
    });
  }
};
