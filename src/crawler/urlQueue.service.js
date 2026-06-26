// services/urlQueue.service.js

import UrlQueue from "../models/UrlQueue.js";

class UrlQueueService {
  async add(url, discoveredFrom = null, depth = 0) {
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
      }
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
      }
    );
  }

  async markCompleted(id) {
    await UrlQueue.findByIdAndUpdate(id, {
      $set: {
        status: "completed",
      },
    });
  }

  async markFailed(id, error) {
    await UrlQueue.findByIdAndUpdate(id, {
      $set: {
        status: "failed",
        lastError: error,
      },
    });
  }
}

export default new UrlQueueService();