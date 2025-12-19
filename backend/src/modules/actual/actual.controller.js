import {
  getAllSensorDataService,
  deleteAllSensorDataService,
} from "./actual.service.js";

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

export const deleteAllSensorData = async (req, res, next) => {
  try {
    const deleted = await deleteAllSensorDataService();

    return res.status(200).json({
      status: "success",
      message: "All sensor data deleted",
      deletedCount: deleted.count,
    });
  } catch (err) {
    console.error("❌ Error deleting sensor data:", err);
    return res.status(500).json({
      status: "error",
      message: "Internal Server Error",
    });
  }
};
