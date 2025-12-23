import axios from "axios";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:8500";
const REQUEST_TIMEOUT = 10000;

// ========================================
// ML SERVICE STATUS
// ========================================

let mlOnline = false;
let lastHealthCheck = null;

export function getMlStatus() {
  return {
    online: mlOnline,
    lastCheck: lastHealthCheck,
  };
}

// ========================================
// INITIAL HEALTH CHECK (LOG ONCE)
// ========================================

export async function initMLHealth() {
  console.log("🔍 [ML] Initial health check...");

  const ok = await checkMLHealth({ silent: true });

  console.log(
    ok
      ? `✅ [ML] Service ONLINE | Last health check: ${lastHealthCheck.toISOString()}`
      : `❌ [ML] Service OFFLINE | Last health check: ${lastHealthCheck.toISOString()}`
  );
}

// ========================================
// HEALTH CHECK (INTERNAL / SILENT BY DEFAULT)
// ========================================

export async function checkMLHealth({ silent = false } = {}) {
  try {
    const res = await axios.get(`${ML_SERVICE_URL}/health`, {
      timeout: 5000,
    });

    mlOnline = res.status === 200;
    lastHealthCheck = new Date();

    if (!silent && mlOnline) {
      console.log("✅ [ML] Service is ONLINE");
    }

    return mlOnline;
  } catch (err) {
    mlOnline = false;
    lastHealthCheck = new Date();

    if (!silent) {
      console.error("❌ [ML] Service is OFFLINE:", err.message);
    }

    return false;
  }
}

// ========================================
// ML PREDICTION REQUEST
// ========================================

export async function requestMLPrediction(deviceId, lookbackHours = 24) {
  // 🔒 Lazy health check (silent)
  if (!mlOnline) {
    await checkMLHealth({ silent: true });
    if (!mlOnline) {
      throw new Error("ML service is offline");
    }
  }

  try {
    const res = await axios.post(
      `${ML_SERVICE_URL}/predict`,
      {
        device_id: deviceId,
        lookback_hours: lookbackHours,
      },
      {
        timeout: REQUEST_TIMEOUT,
        headers: { "Content-Type": "application/json" },
      }
    );

    return res.data;
  } catch (err) {
    // Mark offline if ML fails
    mlOnline = false;

    if (err.response?.status === 422) {
      console.error("❌ [ML] 422 Validation Error", {
        device_id: deviceId,
        lookback_hours: lookbackHours,
      });
    }

    throw err;
  }
}

export { mlOnline };
