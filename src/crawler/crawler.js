// crawler.js

const axios = require("axios");
const cheerio = require("cheerio");

class Crawler {
    constructor() {
        this.timeout = 10000;
        this.userAgent =
            "TaimoorSearchBot/1.0 (+https://your-domain.com/bot)";
    }

    async fetchPage(url) {
        try {
            const response = await axios.get(url, {
                timeout: this.timeout,
                headers: {
                    "User-Agent": this.userAgent,
                },
                maxRedirects: 5,
            });

            return response.data;
        } catch (error) {
            console.error(`Failed to fetch ${url}`);
            console.error(error.message);

            return null;
        }
    }

    cleanText(text) {
        return text
            .replace(/\s+/g, " ")
            .replace(/\n/g, " ")
            .trim();
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
            } catch (err) {
                // ignore invalid urls
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

    async crawl(url) {
        console.log(`\nCrawling: ${url}\n`);

        const html = await this.fetchPage(url);

        if (!html) {
            return null;
        }

        const $ = cheerio.load(html);

        $("script").remove();
        $("style").remove();
        $("noscript").remove();
        $("svg").remove();

        const title = this.cleanText($("title").first().text());

        const description =
            $('meta[name="description"]').attr("content") || "";

        const content = this.cleanText(
            $("main").length
                ? $("main").text()
                : $("body").text()
        );

        const headings = this.extractHeadings($);

        const links = this.extractLinks($, url);

        return {
            url,
            title,
            description: this.cleanText(description),
            headings,
            content,
            links,
            linksCount: links.length,
            crawledAt: new Date(),
        };
    }
}

(async () => {
    const crawler = new Crawler();

    const page = await crawler.crawl(
        "https://nodejs.org"
    );

    if (!page) {
        return;
    }
console.log(page.links.slice(0, 10));
    console.log({
        url: page.url,
        title: page.title,
        description: page.description,
        headings: page.headings.slice(0, 5),
        linksCount: page.linksCount,
        contentPreview: page.content.slice(0, 500),
    });
})();