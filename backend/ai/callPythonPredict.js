import { spawn } from "child_process";
import path from "path";

const PYTHON_PATH = "python"; // atau python3 kalau pakai Linux/Mac
const SERVICE_PATH = path.join(process.cwd(), "ai", "predict_service.py");

export const runPrediction = (input) => {
  return new Promise((resolve, reject) => {
    const py = spawn(PYTHON_PATH, [SERVICE_PATH]);

    let result = "";
    let error = "";

    py.stdout.on("data", (data) => {
      result += data.toString();
    });

    py.stderr.on("data", (data) => {
      error += data.toString();
    });

    py.on("close", () => {
      if (error) return reject(error);

      try {
        return resolve(JSON.parse(result));
      } catch (err) {
        return reject(err);
      }
    });

    py.stdin.write(JSON.stringify(input));
    py.stdin.write("\n");
    py.stdin.end();
  });
};

// 👉 HEALTH CHECK
export const checkPython = () => {
  return new Promise((resolve, reject) => {
    const py = spawn(PYTHON_PATH, [SERVICE_PATH]);

    let result = "";
    let error = "";

    py.stdout.on("data", (data) => {
      result += data.toString();
    });

    py.stderr.on("data", (data) => {
      error += data.toString();
    });

    py.on("close", () => {
      if (error) return reject(error);

      try {
        resolve({
          status: "Python is running",
          output: result || "OK",
        });
      } catch (err) {
        reject(err);
      }
    });

    // kirim input dummy untuk memastikan python bisa memproses
    py.stdin.write(
      JSON.stringify({ temperature: 1, humidity: 1, tvoc: 1, eco2: 1, dust: 1 })
    );
    py.stdin.write("\n");
    py.stdin.end();
  });
};
