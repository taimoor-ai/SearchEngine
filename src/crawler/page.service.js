const crypto = require("crypto");
const Page = require("../models/Page");

class PageService {
    async save(page) {
        const domain = new URL(page.url).hostname;

        const hash = crypto
            .createHash("sha256")
            .update(page.content)
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

        return Page.findOneAndUpdate(
            { url: page.url },
            document,
            {
                upsert: true,
                new: true,
                runValidators: true,
            }
        );
    }
}

module.exports = new PageService();