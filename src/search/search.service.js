// search/search.service.js

import InvertedIndex from "../models/InvertedIndex.js";
import Page from "../models/Page.js";
import queryProcessor from "./queryProcessor.js";

class SearchService {
  async search(query) {
    const terms = queryProcessor.process(query);

    if (!terms.length) {
      return [];
    }

    //---------------------------------------------------
    // Load every matching term
    //---------------------------------------------------

    const indexDocs =
      await InvertedIndex.find({
        term: {
          $in: terms,
        },
      });

    //---------------------------------------------------
    // Candidate documents
    //---------------------------------------------------

    const candidates = new Map();

    for (const termDoc of indexDocs) {
      for (const posting of termDoc.postings) {
        const id = posting.pageId.toString();

        if (!candidates.has(id)) {
          candidates.set(id, {
            pageId: id,
            score: 0,
          });
        }

        candidates.get(id).score += posting.frequency;
      }
    }

    //---------------------------------------------------
    // Sort by score
    //---------------------------------------------------

    const sorted = [...candidates.values()].sort(
      (a, b) => b.score - a.score
    );

    //---------------------------------------------------
    // Fetch pages
    //---------------------------------------------------

    const results = [];

    for (const candidate of sorted) {
      const page = await Page.findById(
        candidate.pageId
      );

      if (!page) continue;

      results.push({
        title: page.title,
        url: page.url,
        description: page.description,
        score: candidate.score,
      });
    }

    return results;
  }
}

export default new SearchService();