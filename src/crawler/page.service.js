// crawler/page.service.js

import crypto from "crypto";
import Page from "../models/Page.js";

class PageService {
  async save(page) {
    const domain = new URL(page.url).hostname.toLowerCase();

    const hash = crypto
      .createHash("sha256")
      .update(page.content || "")
      .digest("hex");

    const existingPage = await Page.findOne({
      url: page.url,
    });

    let crawlCount = 1;
    let contentChanged = true;

    if (existingPage) {
      crawlCount = existingPage.crawlCount + 1;
      contentChanged = existingPage.hash !== hash;
    }

    const document = {
      url: page.url,
      domain,

      title: page.title,
      description: page.description,
      headings: page.headings,
      content: page.content,

      outgoingLinks: page.links,

      hash,
      contentChanged,

      crawlStatus: "completed",

      statusCode: page.statusCode,
      responseTime: page.responseTime,

      crawlCount,

      lastCrawledAt: new Date(),
    };

    return await Page.findOneAndUpdate(
      { url: page.url },
      document,
      {
        upsert: true,
        returnDocument: "after", // replaces new: true
        runValidators: true,
      }
    );
  }
}

export default new PageService();