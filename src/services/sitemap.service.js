// services/sitemap.service.js

import axios from "axios";
import { XMLParser } from "fast-xml-parser";
import { normalizeUrl } from "../utils/urlNormalizer.js";
class SitemapService {
  constructor() {
    this.timeout = 10000;

    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      trimValues: true,
    });

    // Prevent infinite recursion
    this.maxDepth = 5;

     // NEW
    this.cache = new Map();

    // Cache for 24 hours
    this.CACHE_TTL = 24 * 60 * 60 * 1000;
  }

  /**
   * Download sitemap XML
   */
  async fetch(url) {
    const response = await axios.get(url, {
      timeout: this.timeout,
      validateStatus: (status) => status === 200,
      headers: {
        "User-Agent": "TaimoorSearchBot/1.0 (+https://your-domain.com/bot)",
      },
    });

    return response.data;
  }

  /**
   * Parse sitemap recursively.
   */
  async parse(sitemapUrl) {

    sitemapUrl = normalizeUrl(sitemapUrl);

    if (!sitemapUrl) {
        return [];
    }

    // ----------------------------
    // Check Cache
    // ----------------------------

    const cached = this.cache.get(sitemapUrl);

    if (
        cached &&
        Date.now() - cached.cachedAt < this.CACHE_TTL
    ) {
        console.log(
            `[Sitemap] Using cache: ${sitemapUrl}`
        );

        return cached.urls;
    }

    const visited = new Set();

    const urls = await this.parseRecursive(
        sitemapUrl,
        visited,
        0
    );

    const uniqueUrls = [...new Set(urls)];

    // ----------------------------
    // Save Cache
    // ----------------------------

    this.cache.set(sitemapUrl, {
        urls: uniqueUrls,
        cachedAt: Date.now(),
    });

    return uniqueUrls;
}

  async parseRecursive(sitemapUrl, visited, depth) {
    if (depth > this.maxDepth) {
      return [];
    }

    if (visited.has(sitemapUrl)) {
      return [];
    }

    visited.add(sitemapUrl);

    console.log(`[Sitemap] Downloading ${sitemapUrl}`);

    let xml;

    try {
      xml = await this.fetch(sitemapUrl);
    } catch (error) {
      console.log(`[Sitemap] Failed ${error.message} ${sitemapUrl}`);

      return [];
    }

    const parsed = this.parser.parse(xml);

    const urls = [];

    // ------------------------------------
    // Normal sitemap
    // ------------------------------------

    if (parsed.urlset?.url) {
      const pages = Array.isArray(parsed.urlset.url)
        ? parsed.urlset.url
        : [parsed.urlset.url];

      for (const page of pages) {
        if (page.loc) {
          const normalized = normalizeUrl(page.loc.trim());

          if (normalized) {
            urls.push(normalized);
          }
        }
      }

      return urls;
    }

    // ------------------------------------
    // Sitemap Index
    // ------------------------------------

    if (parsed.sitemapindex?.sitemap) {
      const sitemaps = Array.isArray(parsed.sitemapindex.sitemap)
        ? parsed.sitemapindex.sitemap
        : [parsed.sitemapindex.sitemap];

      for (const sitemap of sitemaps) {
        if (!sitemap.loc) continue;

        const sitemapUrl = normalizeUrl(sitemap.loc.trim());

        if (!sitemapUrl) {
          continue;
        }

        const childUrls = await this.parseRecursive(
          sitemapUrl,
          visited,
          depth + 1,
        );

        urls.push(...childUrls);
      }
    }

    return urls;
  }
}

export default new SitemapService();
