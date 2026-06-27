// utils/retryPolicy.js

const RETRYABLE_STATUS_CODES = new Set([
  408, // Request Timeout
  425, // Too Early
  429, // Too Many Requests
  500, // Internal Server Error
  502, // Bad Gateway
  503, // Service Unavailable
  504, // Gateway Timeout
]);

const RETRYABLE_ERROR_CODES = new Set([
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "ECONNABORTED",
  "EAI_AGAIN",
]);

export function shouldRetry(error) {
  // --------------------------
  // Axios HTTP Error
  // --------------------------

  if (error.response) {
    return RETRYABLE_STATUS_CODES.has(
      error.response.status
    );
  }

  // --------------------------
  // Network Error
  // --------------------------

  if (error.code) {
    return RETRYABLE_ERROR_CODES.has(error.code);
  }

  return false;
}