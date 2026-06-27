// services/urlQueue.service.js

import UrlQueue from "../models/UrlQueue.js";
import { normalizeUrl } from "../utils/urlNormalizer.js";
class UrlQueueService {
  async add(url, discoveredFrom = null, depth = 0) {
    url = normalizeUrl(url);

    if (!url) {
      return;
    }

    const domain = new URL(url).hostname.toLowerCase();
    await UrlQueue.updateOne(
      { url },
      {
        $setOnInsert: {
          url,
          domain,
          discoveredFrom,
          depth,
          status: "pending",
        },
      },
      {
        upsert: true,
      },
    );
  }

  async addMany(urls, parentUrl, depth) {
    for (const url of urls) {
      await this.add(url, parentUrl, depth);
    }
  }

  async getNext() {
    return await UrlQueue.findOneAndUpdate(
      {
        status: "pending",

        nextCrawlAt: {
          $lte: new Date(),
        },
      },
      {
        $set: {
          status: "processing",
        },
      },
      {
        sort: {
          priority: -1,
          createdAt: 1,
        },
        returnDocument: "after",
      },
    );
  }

  async markCompleted(id) {
    await UrlQueue.findByIdAndUpdate(id, {
      $set: {
        status: "completed",
        lastError: null,
      },
    });
  }

  async markFailed(id, error) {
    await UrlQueue.findByIdAndUpdate(id, {
      $set: {
        status: "failed",
        lastError: error,
        lastTriedAt: new Date(),
      },
    });
  }
  async retry(id, error) {
    const job = await UrlQueue.findById(id);

    if (!job) {
      return false;
    }

    // Max retries reached
    if (job.retries >= job.maxRetries) {
      await this.markFailed(id, error);
      return false;
    }
    this.log(`[Retry] ${job.url} (${job.retries + 1}/${job.maxRetries})`);
    // Fixed delay (we'll replace this with exponential backoff later)
    const delay = 60 * 1000;

    await UrlQueue.findByIdAndUpdate(id, {
      $set: {
        status: "pending",
        lastError: error,
        lastTriedAt: new Date(),
        nextCrawlAt: new Date(Date.now() + delay),
      },

      $inc: {
        retries: 1,
      },
    });

    return true;
  }
}

export default new UrlQueueService();
