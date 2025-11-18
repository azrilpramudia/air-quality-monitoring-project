import * as service from "./sensor.service.js";
import { success, error } from "../../utils/response.js";

export const getAll = async (req, res, next) => {
  try {
    const data = await service.getAllSensorData();
    response.success(res, data);
  } catch (err) {
    next(err);
  }
};
