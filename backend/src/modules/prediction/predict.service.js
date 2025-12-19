// ========================================
// predict.service.js - FIXED VERSION
// ========================================

import axios from "axios";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:8500";
const HEALTH_CHECK_INTERVAL = 30000; // Check every 30 seconds
const REQUEST_TIMEOUT = 10000; // 10 second timeout

// ========================================
// ML SERVICE STATUS
// ========================================

let mlOnline = false;
let lastHealthCheck = null;
let healthCheckTimer = null;

/**
 * Get current ML service status
 */
export function getMlStatus() {
  return {
    online: mlOnline,
    lastCheck: lastHealthCheck,
  };
}

/**
 * Check if ML service is online
 */
export async function checkMLHealth() {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/health`, {
      timeout: 5000,
    });

    const wasOffline = !mlOnline;
    mlOnline = response.status === 200;
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

/**
 * Start periodic health checks
 */
export function startMLHealthCheck() {
  console.log(
    `🔍 [ML] Starting health checks every ${HEALTH_CHECK_INTERVAL}ms`
  );

  // Initial check
  checkMLHealth();

  // Periodic checks
  if (healthCheckTimer) {
    clearInterval(healthCheckTimer);
  }

  healthCheckTimer = setInterval(() => {
    checkMLHealth();
  }, HEALTH_CHECK_INTERVAL);
}

/**
 * Stop health checks
 */
export function stopMLHealthCheck() {
  if (healthCheckTimer) {
    clearInterval(healthCheckTimer);
    healthCheckTimer = null;
    console.log("🛑 [ML] Health checks stopped");
  }
}

// ========================================
// ML PREDICTION REQUEST
// ========================================

/**
 * Request prediction from ML service
 */
export async function requestMLPrediction(features) {
  if (!mlOnline) {
    throw new Error("ML service is offline");
  }

  try {
    const response = await axios.post(
      `${ML_SERVICE_URL}/predict`,
      { features },
      {
        timeout: REQUEST_TIMEOUT,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    // Validate response
    if (!response.data || !response.data.prediction) {
      throw new Error("Invalid ML response format");
    }

    return response.data;
  } catch (err) {
    // If request fails, mark as offline and trigger health check
    if (err.code === "ECONNREFUSED" || err.code === "ETIMEDOUT") {
      mlOnline = false;
      console.error("❌ [ML] Service unreachable, marking as offline");
      checkMLHealth(); // Immediate recheck
    }

    throw err;
  }
}

// ========================================
// EXPORT FOR WORKER
// ========================================

// Export reactive getter instead of direct variable
export { mlOnline };

// Auto-start health checks when module loads
startMLHealthCheck();
