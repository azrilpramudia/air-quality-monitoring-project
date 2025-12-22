// ========================================
// predict.service.js — FINAL (NO HEALTH SPAM)
// ========================================

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
// MANUAL HEALTH CHECK (ON-DEMAND)
// ========================================

export async function checkMLHealth() {
  try {
    const res = await axios.get(`${ML_SERVICE_URL}/health`, {
      timeout: 5000,
    });

    mlOnline = res.status === 200;
    lastHealthCheck = new Date();

    if (mlOnline) {
      console.log("✅ [ML] Service is ONLINE");
    }

    return mlOnline;
  } catch (err) {
    mlOnline = false;
    lastHealthCheck = new Date();
    console.error("❌ [ML] Service is OFFLINE:", err.message);
    return false;
  }
}

// ========================================
// ML PREDICTION REQUEST
// ========================================

export async function requestMLPrediction(deviceId, lookbackHours = 24) {
  // 🔒 cek health SEKALI kalau belum online
  if (!mlOnline) {
    await checkMLHealth();
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
    if (err.response?.status === 422) {
      console.error("❌ [ML] 422 Validation Error");
      console.error("❌ Payload:", {
        device_id: deviceId,
        lookback_hours: lookbackHours,
      });
    }

    // kalau gagal → tandai offline
    mlOnline = false;
    throw err;
  }
}

export { mlOnline };
