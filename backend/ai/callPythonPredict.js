import { spawn } from "child_process";
import path from "path";

export const runPrediction = (inputData) => {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn("python", [
      path.join("ai", "predict_service.py"),
    ]);

    let output = "";
    let errorOutput = "";

    pythonProcess.stdout.on("data", (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    pythonProcess.on("close", () => {
      if (errorOutput) {
        return reject(errorOutput);
      }
      try {
        const parsed = JSON.parse(output.trim());
        resolve(parsed);
      } catch (err) {
        reject("Failed to parse prediction output: " + output);
      }
    });

    // Kirim data JSON → Python
    pythonProcess.stdin.write(JSON.stringify(inputData) + "\n");
    pythonProcess.stdin.end();
  });
};
