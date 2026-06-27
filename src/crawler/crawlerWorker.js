// crawler/crawlerWorker.js

import Crawler from "./crawler.js";
import pageService from "../services/page.service.js";
import urlQueueService from "../services/urlQueue.service.js";
import robotsService from "../services/robots.service.js ";
import domainService from "../services/domain.service.js";
import { shouldRetry } from "../utils/retryPolicy.js";
class CrawlerWorker {
  constructor(options = {}) {
    this.crawler = new Crawler();

    this.running = false;

    this.maxDepth = options.maxDepth ?? 3;
    this.emptyQueueDelay = options.emptyQueueDelay ?? 5000;
    this.retryLimit = options.retryLimit ?? 3;

    this.stats = {
      processed: 0,
      success: 0,
      failed: 0,
      startedAt: null,
    };
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  log(message) {
    console.log(`[${new Date().toISOString()}] ${message}`);
  }

  async processNextUrl() {
    const job = await urlQueueService.getNext();

    if (!job) {
      this.log("Queue is empty.");

      return false;
    }

    await domainService.initialize(job.url);

    const allowed = await domainService.canCrawl(job.url);
    if (!allowed) {
      this.log(`[Robots] Blocked: ${job.url}`);

      await urlQueueService.markCompleted(job._id);
      this.stats.processed++;
      this.stats.success++;

      this.log(`Completed ${job.url}`);
      return true;
    }
    // Get crawl delay
    // const crawlDelay = await robotsService.getCrawlDelay(job.url);

    // if (crawlDelay > 0) {
    //   this.log(
    //     `[Robots] Waiting ${crawlDelay} second(s) before crawling ${job.url}`,
    //   );

    //   await this.sleep(crawlDelay * 1000);
    // }
    await domainService.waitIfNeeded(job.url);
    this.log(`Processing ${job.url}`);

    try {
      const page = await this.crawler.crawl(job.url);

      if (!page) {
        throw new Error("Crawler returned null.");
      }

      await pageService.save(page);

      this.log(`[MongoDB] Saved ${job.url}`);
      if (job.depth < this.maxDepth) {
        await urlQueueService.addMany(
          page.links,
          page.canonicalUrl || page.url,
          job.depth + 1,
        );

        this.log(`[Queue] Added ${page.links.length} new URLs`);
      }

      await urlQueueService.markCompleted(job._id);

      this.stats.processed++;
      this.stats.success++;

      this.log(`Completed ${job.url}`);

      return true;
    } catch (error) {
      this.stats.processed++;
      this.log(
        `[RetryPolicy] ${job.url}
Reason: ${error.code || error.response?.status}
Retry: ${shouldRetry(error)}`,
      );
      if (shouldRetry(error)) {
        const scheduled = await urlQueueService.retry(job._id, error.message);

        if (scheduled) {
          this.log(`[Retry] ${job.url}`);
        } else {
          this.stats.failed++;

          this.log(`[Failed] Max retries reached`);
        }
      } else {
        await urlQueueService.markFailed(job._id, error.message);

        this.stats.failed++;

        this.log(`[Permanent Failure] ${job.url}`);
      }

      return false;
    }
  }

  async start() {
    if (this.running) {
      this.log("Worker already running.");

      return;
    }

    this.running = true;

    this.stats.startedAt = new Date();

    this.log("================================");
    this.log("Crawler Worker Started");
    this.log("================================");

    while (this.running) {
      try {
        const processed = await this.processNextUrl();

        if (!processed) {
          await this.sleep(this.emptyQueueDelay);
        }
      } catch (error) {
        this.log(error.message);

        await this.sleep(3000);
      }
    }

    this.log("Worker stopped.");
  }

  stop() {
    this.running = false;
  }

  getStats() {
    return {
      ...this.stats,
      uptime: Date.now() - this.stats.startedAt.getTime(),
    };
  }
}

export default new CrawlerWorker({
  maxDepth: 3,
  emptyQueueDelay: 5000,
  retryLimit: 3,
});
