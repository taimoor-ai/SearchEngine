// crawler.js

import axios from "axios";
import * as cheerio from "cheerio";
import { normalizeUrl } from "../utils/urlNormalizer.js";
class Crawler {
  constructor() {
    this.timeout = 10000;
    this.userAgent = "TaimoorSearchBot/1.0 (+https://your-domain.com/bot)";
  }

  async fetchPage(url) {
    const start = Date.now();

    const response = await axios.get(url, {
      timeout: this.timeout,
      headers: {
        "User-Agent": this.userAgent,
      },
      maxRedirects: 5,
    });

    return {
      html: response.data,
      statusCode: response.status,
      responseTime: Date.now() - start,
    };
  }

  cleanText(text) {
    return text.replace(/\s+/g, " ").replace(/\n/g, " ").trim();
  }

  extractLinks($, baseUrl) {
    const links = new Set();

    $("a[href]").each((_, element) => {
      try {
        const href = $(element).attr("href");

        if (!href) return;

        if (
          href.startsWith("#") ||
          href.startsWith("mailto:") ||
          href.startsWith("tel:") ||
          href.startsWith("javascript:")
        ) {
          return;
        }

        const absoluteUrl = new URL(href, baseUrl).href;

        links.add(absoluteUrl);
      } catch {
        // Ignore invalid URLs
      }
    });

    return [...links];
  }

  extractHeadings($) {
    const headings = [];

    $("h1,h2,h3").each((_, element) => {
      const text = this.cleanText($(element).text());

      if (text) {
        headings.push(text);
      }
    });

    return headings;
  }
  extractCanonical($, baseUrl) {
    const href = $('link[rel="canonical"]').attr("href");

    if (!href) {
      return null;
    }

    try {
      const canonical = new URL(href, baseUrl).href;

      return normalizeUrl(canonical);
    } catch {
      return null;
    }
  }
  async crawl(url) {
    console.log(`\nCrawling: ${url}\n`);

    const response = await this.fetchPage(url);

    if (!response) return null;

    const { html, statusCode, responseTime } = response;

    const $ = cheerio.load(html);

    $("script").remove();
    $("style").remove();
    $("noscript").remove();
    $("svg").remove();

    const title = this.cleanText($("title").first().text());

    const description = $('meta[name="description"]').attr("content") || "";
    const canonicalUrl = this.extractCanonical($, url);
    const content = this.cleanText(
      $("main").length ? $("main").text() : $("body").text(),
    );

    const headings = this.extractHeadings($);

    const links = this.extractLinks($, url);

    return {
      url,
      title,
      description,
      headings,
      content,
      links,
      canonicalUrl,
      statusCode,
      responseTime,
    };
  }
}

export default Crawler;
