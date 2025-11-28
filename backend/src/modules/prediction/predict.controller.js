import { runPrediction } from "../../ai/callPythonPredict.js";

export const getPrediction = async (req, res) => {
  try {
    const realtimeData = req.body;

    const result = await runPrediction(realtimeData);

    res.json({
      success: true,
      input: realtimeData,
      prediction: result.prediction,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.toString(),
    });
  }
};
