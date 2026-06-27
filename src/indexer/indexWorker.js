import Page from "../models/page.js";
import indexService from "./index.service.js";

class IndexWorker {
  constructor() {
    this.running = false;
    this.interval = 3000;
  }

  log(message) {
    console.log(`[Indexer] ${message}`);
  }

  async processNextPage() {
    const page = await Page.findOne({
      isIndexed: false,
    });

    if (!page) {
      return false;
    }

    this.log(`Indexing ${page.url}`);

    try {
      await indexService.indexPage(page);

      page.isIndexed = true;
      page.indexedAt = new Date();

      await page.save();

      this.log(`[Indexing] :--Completed ${page.url}`);

      return true;
    } catch (error) {
      console.error(error);

      return false;
    }
  }

  async start() {
    if (this.running) {
      return;
    }

    this.running = true;

    this.log("Started");

    while (this.running) {
      const processed = await this.processNextPage();

      if (!processed) {
        await new Promise((resolve) =>
          setTimeout(resolve, this.interval)
        );
      }
    }
  }

  stop() {
    this.running = false;
  }
}

export default new IndexWorker();