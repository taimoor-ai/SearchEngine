// search/search.service.js

import InvertedIndex from "../models/InvertedIndex.js";
import Page from "../models/Page.js";

import queryProcessor from "./queryProcessor.js";
import rankingService from "./ranking.service.js";

class SearchService {
  async search(query) {
    //---------------------------------------------------
    // Process Query
    //---------------------------------------------------

    const terms = queryProcessor.process(query);

    if (!terms.length) {
      return [];
    }

    //---------------------------------------------------
    // Load matching terms from inverted index
    //---------------------------------------------------

    const indexDocs = await InvertedIndex.find({
      term: { $in: terms },
    });

    if (!indexDocs.length) {
      return [];
    }

    //---------------------------------------------------
    // Build candidate documents
    //---------------------------------------------------

    const candidates = new Map();

    for (const termDoc of indexDocs) {
      for (const posting of termDoc.postings) {
        const pageId = posting.pageId.toString();

        if (!candidates.has(pageId)) {
          candidates.set(pageId, {
            pageId,
            score: 0,
            postings: [],
          });
        }

        candidates.get(pageId).postings.push({
          frequency: posting.frequency,
          documentFrequency:
            termDoc.documentFrequency,
        });
      }
    }

    //---------------------------------------------------
    // Load all pages in ONE query
    //---------------------------------------------------

    const pageIds = [...candidates.keys()];

    const pages = await Page.find({
      _id: {
        $in: pageIds,
      },
    });

    if (!pages.length) {
      return [];
    }

    //---------------------------------------------------
    // Create page lookup map
    //---------------------------------------------------

    const pageMap = new Map();

    for (const page of pages) {
      pageMap.set(page._id.toString(), page);
    }

    //---------------------------------------------------
    // Calculate average document length
    //---------------------------------------------------

    const totalLength = pages.reduce(
      (sum, page) => sum + page.documentLength,
      0
    );

    const averageDocumentLength =
      totalLength / pages.length;

    //---------------------------------------------------
    // Total indexed documents
    //---------------------------------------------------

    const totalDocuments =
      await Page.countDocuments({
        isIndexed: true,
      });

    //---------------------------------------------------
    // Calculate BM25 score
    //---------------------------------------------------

    for (const candidate of candidates.values()) {
      const page = pageMap.get(
        candidate.pageId
      );

      if (!page) continue;

      let score = 0;

      for (const posting of candidate.postings) {
        score += rankingService.bm25({
          tf: posting.frequency,
          df: posting.documentFrequency,
          totalDocuments,
          documentLength:
            page.documentLength,
          averageDocumentLength,
        });
      }

      candidate.score = score;
    }

    //---------------------------------------------------
    // Sort
    //---------------------------------------------------

    const sorted = [...candidates.values()].sort(
      (a, b) => b.score - a.score
    );

    //---------------------------------------------------
    // Build Results
    //---------------------------------------------------

    const results = [];

    for (const candidate of sorted) {
      const page = pageMap.get(
        candidate.pageId
      );

      if (!page) continue;

      results.push({
        title: page.title,
        url: page.url,
        description: page.description,
        score: Number(
          candidate.score.toFixed(4)
        ),
      });
    }

    return results;
  }
}

export default new SearchService();