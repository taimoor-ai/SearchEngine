// utils/backoff.js

export function getBackoffDelay(
  retry,
  baseDelay = 60 * 1000,
  maxDelay = 60 * 60 * 1000
) {
  const exponential = baseDelay * Math.pow(2, retry);

  // Random value between 0 and 30 seconds
  const jitter = Math.floor(Math.random() * 30000);

  return Math.min(exponential + jitter, maxDelay);
}