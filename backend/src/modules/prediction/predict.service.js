// ========================================
// predict.service.js — FINAL & CORRECT
// ========================================

import axios from "axios";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:8500";

const HEALTH_CHECK_INTERVAL = 30000;
const REQUEST_TIMEOUT = 10000;

// ========================================
// ML SERVICE STATUS
// ========================================

let mlOnline = false;
let lastHealthCheck = null;
let healthCheckTimer = null;

export function getMlStatus() {
  return {
    online: mlOnline,
    lastCheck: lastHealthCheck,
  };
}

export async function checkMLHealth() {
  try {
    const res = await axios.get(`${ML_SERVICE_URL}/health`, {
      timeout: 5000,
    });

    const wasOffline = !mlOnline;
    mlOnline = res.status === 200;
    lastHealthCheck = new Date();

    if (mlOnline && wasOffline) {
      console.log("✅ [ML] Service is ONLINE");
    }

    return mlOnline;
  } catch (err) {
    const wasOnline = mlOnline;
    mlOnline = false;
    lastHealthCheck = new Date();

    if (wasOnline) {
      console.error("❌ [ML] Service went OFFLINE:", err.message);
    }

    return false;
  }
}

export function startMLHealthCheck() {
  console.log(
    `🔍 [ML] Starting health checks every ${HEALTH_CHECK_INTERVAL}ms`
  );

  checkMLHealth();

  if (healthCheckTimer) clearInterval(healthCheckTimer);

  healthCheckTimer = setInterval(checkMLHealth, HEALTH_CHECK_INTERVAL);
}

export function stopMLHealthCheck() {
  if (healthCheckTimer) {
    clearInterval(healthCheckTimer);
    healthCheckTimer = null;
    console.log("🛑 [ML] Health checks stopped");
  }
}

// ========================================
// ML PREDICTION REQUEST (FIXED)
// ========================================

/**
 * Request prediction from ML service
 * NOTE:
 * - DO NOT send features
 * - ML service pulls data from DB
 */
export async function requestMLPrediction(deviceId, lookbackHours = 24) {
  if (!mlOnline) {
    throw new Error("ML service is offline");
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

    if (!res.data || !res.data.prediction) {
      throw new Error("Invalid ML response format");
    }

    return res.data;
  } catch (err) {
    if (err.code === "ECONNREFUSED" || err.code === "ETIMEDOUT") {
      mlOnline = false;
      console.error("❌ [ML] Service unreachable");
      checkMLHealth();
    }
    throw err;
  }
}

// ========================================
// AUTO START
// ========================================

startMLHealthCheck();

export { mlOnline };
