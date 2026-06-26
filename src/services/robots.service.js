import axios from "axios";
import robotsParser from "robots-parser";
import robotsService from "../services/robots.service.js";
class RobotsService {
  constructor() {
    this.cache = new Map();

    this.userAgent =
      "TaimoorSearchBot/1.0 (+https://your-domain.com/bot)";

    // Cache robots.txt for 24 hours
    this.CACHE_TTL = 24 * 60 * 60 * 1000;
  }

  /**
   * Get the origin of a URL
   * https://react.dev/learn -> https://react.dev
   */
  getOrigin(url) {
    return new URL(url).origin;
  }

  /**
   * Download and cache robots.txt
   */
  async load(url) {
    const origin = this.getOrigin(url);

    // -------------------------
    // Return cached robots.txt
    // -------------------------

    const cached = this.cache.get(origin);

    if (
      cached &&
      Date.now() - cached.cachedAt < this.CACHE_TTL
    ) {
      return cached.parser;
    }

    const robotsUrl = `${origin}/robots.txt`;

    try {
      console.log(`[Robots] Fetching ${robotsUrl}`);

      const response = await axios.get(robotsUrl, {
        timeout: 5000,
        validateStatus: () => true,
      });

      const parser = robotsParser(
        robotsUrl,
        response.status === 200 ? response.data : ""
      );

      this.cache.set(origin, {
        parser,
        cachedAt: Date.now(),
      });

      return parser;
    } catch (error) {
      console.log(
        `[Robots] Failed to fetch ${robotsUrl}`
      );

      // Assume allowed if robots.txt can't be fetched
      const parser = robotsParser(robotsUrl, "");

      this.cache.set(origin, {
        parser,
        cachedAt: Date.now(),
      });

      return parser;
    }
  }

  /**
   * Can we crawl this URL?
   */
  async isAllowed(url) {
    const parser = await this.load(url);

    return parser.isAllowed(url, this.userAgent);
  }

  /**
   * Crawl delay (seconds)
   */
  async getCrawlDelay(url) {
    const parser = await this.load(url);

    const delay = parser.getCrawlDelay(this.userAgent);

    return delay || 0;
  }

  /**
   * Sitemap URLs
   */
  async getSitemaps(url) {
    const parser = await this.load(url);

    return parser.getSitemaps() || [];
  }

  /**
   * Clear cache (optional)
   */
  clearCache() {
    this.cache.clear();
  }
}

export default new RobotsService();