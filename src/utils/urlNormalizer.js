/**
 * URL Normalizer
 *
 * Normalizes URLs before storing them in the URL Frontier.
 */

const TRACKING_PARAMETERS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "fbclid",
  "msclkid",
  "_ga",
  "_gl",
];

export function normalizeUrl(inputUrl) {
  try {
    const url = new URL(inputUrl);

    // ------------------------------------
    // Allow only HTTP/HTTPS
    // ------------------------------------

    if (!["http:", "https:"].includes(url.protocol)) {
      return null;
    }

    // ------------------------------------
    // Normalize hostname
    // ------------------------------------

    url.hostname = url.hostname.toLowerCase();

    // ------------------------------------
    // Remove default ports
    // ------------------------------------

    if (
      (url.protocol === "http:" && url.port === "80") ||
      (url.protocol === "https:" && url.port === "443")
    ) {
      url.port = "";
    }

    // ------------------------------------
    // Remove fragment (#section)
    // ------------------------------------

    url.hash = "";

    // ------------------------------------
    // Remove duplicate slashes
    // ------------------------------------

    url.pathname = url.pathname.replace(/\/{2,}/g, "/");

    // ------------------------------------
    // Remove trailing slash
    // Except root "/"
    // ------------------------------------

    if (
      url.pathname.length > 1 &&
      url.pathname.endsWith("/")
    ) {
      url.pathname = url.pathname.slice(0, -1);
    }

    // ------------------------------------
    // Remove tracking parameters
    // ------------------------------------

    for (const param of TRACKING_PARAMETERS) {
      url.searchParams.delete(param);
    }

    // ------------------------------------
    // Sort query parameters
    // ------------------------------------

    const sortedParams = [...url.searchParams.entries()]
      .sort(([a], [b]) => a.localeCompare(b));

    url.search = "";

    for (const [key, value] of sortedParams) {
      url.searchParams.append(key, value);
    }

    // ------------------------------------
    // Return normalized URL
    // ------------------------------------

    return url.toString();

  } catch {
    return null;
  }
}