// services/domain.service.js

import robotsService from "./robots.service.js";
import sitemapService from "./sitemap.service.js";
class DomainService {
  constructor() {
    /**
     * Cache Structure
     *
     * key = domain
     *
     * {
     *   initialized: Boolean,
     *   crawlDelay: Number,
     *   sitemaps: [],
     *   lastRequestAt: Number,
     *   initializing: Promise | null
     * }
     */
    this.cache = new Map();
  }

  getDomain(url) {
    return new URL(url).hostname.toLowerCase();
  }

  /**
   * Initialize a domain once.
   * Safe even if multiple workers call it simultaneously.
   */
  async initialize(url) {
    const domain = this.getDomain(url);

    let state = this.cache.get(domain);

    // Already initialized
    if (state?.initialized) {
      return state;
    }

    // Another worker is already initializing
    if (state?.initializing) {
      await state.initializing;
      return this.cache.get(domain);
    }

    const initialization = this.initializeDomain(url);

    this.cache.set(domain, {
      initialized: false,
      initializing: initialization,
    });

    await initialization;

    return this.cache.get(domain);
  }

  async initializeDomain(url) {
    const domain = this.getDomain(url);

    console.log(`[Domain] Initializing ${domain}`);

    const crawlDelay = await robotsService.getCrawlDelay(url);

    const sitemapUrls = await robotsService.getSitemaps(url);

    let discoveredUrls = [];

    for (const sitemap of sitemapUrls) {
      const urls = await sitemapService.parse(sitemap);

      discoveredUrls.push(...urls);
    }

    this.cache.set(domain, {
      initialized: true,
      initializing: null,

      crawlDelay,
      sitemaps: sitemapUrls,

      lastRequestAt: 0,
    });

    console.log(`[Domain] ${domain} initialized`);
  }

  async canCrawl(url) {
    await this.initialize(url);

    return robotsService.isAllowed(url);
  }

  async waitIfNeeded(url) {
    const domain = this.getDomain(url);

    await this.initialize(url);

    const state = this.cache.get(domain);

    if (!state) return;

    const now = Date.now();

    const waitTime = state.lastRequestAt + state.crawlDelay * 1000 - now;

    if (waitTime > 0) {
      console.log(`[Domain] Waiting ${waitTime}ms (${domain})`);

      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    state.lastRequestAt = Date.now();
  }

  getSitemaps(url) {
    const domain = this.getDomain(url);

    return this.cache.get(domain)?.sitemaps || [];
  }

  getState(url) {
    const domain = this.getDomain(url);

    return this.cache.get(domain);
  }

  clear() {
    this.cache.clear();
  }

  stats() {
    return {
      domains: this.cache.size,
    };
  }
}

export default new DomainService();
