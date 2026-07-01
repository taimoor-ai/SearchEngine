// search/search.service.js

import InvertedIndex from "../models/InvertedIndex.js";
import Page from "../models/Page.js";
import boostService from "./boost/boost.service.js";
import queryProcessor from "./queryProcessor.js";
import rankingService from "./ranking.service.js";
import snippetService from "./snippet.service.js";
import booleanParser from "./boolean/booleanParser.js";
import booleanService from "./boolean/boolean.service.js";
import phraseService from "./phrase.service.js";
class SearchService {
  evaluateBoolean(postfix, postingMap) {
    const stack = [];

    for (const token of postfix) {
      if (token === "AND") {
        const right = stack.pop();
        const left = stack.pop();

        stack.push(booleanService.and([left, right]));
        continue;
      }

      if (token === "OR") {
        const right = stack.pop();
        const left = stack.pop();

        stack.push(booleanService.or([left, right]));
        continue;
      }

      if (token === "NOT") {
        const exclude = stack.pop();
        const include = stack.pop() || new Set();

        stack.push(booleanService.not(include, exclude));

        continue;
      }

      stack.push(booleanService.getPosting(postingMap, token));
    }

    return stack.pop() || new Set();
  }
  async search(query) {
    //---------------------------------------------------
    // Process Query
    //---------------------------------------------------

    const parsedBoolean = booleanParser.parse(query);

const { terms, phrases } = queryProcessor.parse(query);

if (!terms.length && !phrases.length) {
    return [];
}
   

    //---------------------------------------------------
    // Load matching terms from inverted index
    //---------------------------------------------------
    const phraseTerms = phrases.flat();

    const allTerms = [...new Set([...terms, ...phraseTerms])];
    const indexDocs = await InvertedIndex.find({
      term: {
        $in: allTerms,
      },
    });
    if (!indexDocs.length) {
      return [];
    }
     const postingMap = booleanService.buildPostingMap(indexDocs);
   const booleanCandidates =
  this.evaluateBoolean(
    parsedBoolean.postfix,
    postingMap
  );
    //---------------------------------------------------
    // Build candidate documents
    //---------------------------------------------------

    const candidates = new Map();

  for (const termDoc of indexDocs) {
  for (const posting of termDoc.postings) {
    const pageId = posting.pageId.toString();

    // Boolean filter
    if (
      booleanCandidates.size &&
      !booleanCandidates.has(pageId)
    ) {
      continue;
    }

    if (!candidates.has(pageId)) {
      candidates.set(pageId, {
        pageId,
        score: 0,
        postings: [],
      });
    }

    candidates.get(pageId).postings.push({
      term: termDoc.term,
      frequency: posting.frequency,
      documentFrequency:
        termDoc.documentFrequency,
      positions: posting.positions,
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
      0,
    );

    const averageDocumentLength = totalLength / pages.length;

    //---------------------------------------------------
    // Total indexed documents
    //---------------------------------------------------

    const totalDocuments = await Page.countDocuments({
      isIndexed: true,
    });

    //---------------------------------------------------
    // Calculate BM25 score
    //---------------------------------------------------

    for (const candidate of candidates.values()) {
      const page = pageMap.get(candidate.pageId);

      if (!page) continue;

      let score = 0;

      for (const posting of candidate.postings) {
        score += rankingService.bm25({
          tf: posting.frequency,
          df: posting.documentFrequency,
          totalDocuments,
          documentLength: page.documentLength,
          averageDocumentLength,
        });
      }
      const boost = boostService.calculate(page, terms);

      candidate.score = score + boost;
      if (phrases.length) {
        let phraseMatched = false;

        for (const phrase of phrases) {
          if (phraseService.matches(candidate.postings, phrase)) {
            phraseMatched = true;
            candidate.score += 100;
          }
        }

        if (!phraseMatched) {
          candidate.score = 0;
        }
      }
    }

    //---------------------------------------------------
    // Sort
    //---------------------------------------------------
    const filtered = [...candidates.values()].filter(
      (candidate) => candidate.score > 0,
    );
    const sorted = filtered.sort((a, b) => b.score - a.score);

    //---------------------------------------------------
    // Build Results
    //---------------------------------------------------

    const results = [];

    for (const candidate of sorted) {
      const page = pageMap.get(candidate.pageId);

      if (!page) continue;

      results.push({
        title: page.title,
        url: page.url,
        description: page.description,

        snippet: snippetService.generate(page.content, terms),

        score: Number(candidate.score.toFixed(4)),
      });
    }

    return results;
  }
}

export default new SearchService();
