// indexer/indexWorker.js

import Page from "../models/Page.js";
import indexService from "./index.service.js";

class IndexWorker {
  constructor() {
    this.running = false;
    this.interval = 3000;
  }

  log(message) {
    console.log(`[IndexWorker] ${message}`);
  }

  async processNextPage() {
    // Get next page waiting for indexing
    const page = await Page.findOne({
      isIndexed: false,
    }).sort({
      updatedAt: 1,
    });

    if (!page) {
      return false;
    }

    this.log(`Indexing ${page.url}`);

    try {
      // Skip unchanged pages
      if (page.isIndexed && !page.contentChanged) {
        this.log(`Skipping ${page.url} (unchanged)`);
        return false;
      }

      // Index the page
      const result = await indexService.indexPage(page);

      if (!result.indexed) {
        this.log(`No tokens found in ${page.url}`);

        page.isIndexed = true;
        page.indexedAt = new Date();

        await page.save();

        return true;
      }

      // Update page metadata
      page.documentLength = result.documentLength;
      page.uniqueTerms = result.uniqueTerms;

      page.isIndexed = true;
      page.contentChanged = false;
      page.indexedAt = new Date();

      await page.save();

      this.log(
        `Indexed ${page.url}
Terms: ${result.uniqueTerms}
Words: ${result.documentLength}`
      );

      return true;
    } catch (error) {
      console.error(error);

      this.log(`Failed: ${page.url}`);

      return false;
    }
  }

  async start() {
    if (this.running) {
      return;
    }

    this.running = true;

    this.log("Worker started.");

    while (this.running) {
      const processed =
        await this.processNextPage();

      if (!processed) {
        await new Promise((resolve) =>
          setTimeout(resolve, this.interval)
        );
      }
    }
  }

  stop() {
    this.running = false;

    this.log("Worker stopped.");
  }
}

export default new IndexWorker();