// crawler/crawlManager.js

const Crawler = require("./crawler");
const pageService = require("./page.service");
class CrawlManager {
    constructor() {
        this.crawler = new Crawler();

        this.seedUrls = [
            "https://react.dev",
            "https://nodejs.org",
            "https://expressjs.com"
        ];
    }

    async start() {
        console.log("=================================");
        console.log("Crawler Started");
        console.log("=================================");

        for (const url of this.seedUrls) {
            try {
                const page = await this.crawler.crawl(url);

                if (page) {
                    console.log(`✓ Crawled ${url}`);

                   
                    await pageService.save(page);
                }
            } catch (err) {
                console.error(err.message);
            }
        }

        console.log("Initial crawling completed.");
    }
}

module.exports = new CrawlManager();