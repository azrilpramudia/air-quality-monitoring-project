import { checkPython } from "../../../ai/callPythonPredict.js";

export const checkPythonHealth = async (req, res) => {
  try {
    const result = await checkPython();
    res.json({
      success: true,
      python: result,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Python service error",
      error: err.toString(),
    });
  }
};
