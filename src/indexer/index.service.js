// indexer/index.service.js

import InvertedIndex from "../models/InvertedIndex.js";
import preprocessor from "./preprocessor.js";

class IndexService {
  /**
   * Build a term frequency map
   */
  buildTermMap(tokens) {
    const terms = new Map();

    tokens.forEach((term, position) => {
      if (!terms.has(term)) {
        terms.set(term, {
          frequency: 0,
          positions: [],
        });
      }

      const entry = terms.get(term);

      entry.frequency++;
      entry.positions.push(position);
    });

    return terms;
  }

  /**
   * Index a page
   */
  async indexPage(page) {
    // -----------------------------
    // Preprocess page
    // -----------------------------

    const tokens = preprocessor.process(page.content);

    if (!tokens.length) {
      return {
        indexed: false,
        documentLength: 0,
        uniqueTerms: 0,
      };
    }

    // -----------------------------
    // Build Term Map
    // -----------------------------

    const terms = this.buildTermMap(tokens);

    // -----------------------------
    // Remove previous postings
    // -----------------------------

    await InvertedIndex.updateMany(
      {},
      {
        $pull: {
          postings: {
            pageId: page._id,
          },
        },
      },
    );

    // -----------------------------
    // Bulk Operations
    // -----------------------------

    const operations = [];

    for (const [term, data] of terms) {
      operations.push({
        updateOne: {
          filter: {
            term,
          },

          update: {
            $setOnInsert: {
              term,
            },

            $push: {
              postings: {
                pageId: page._id,
                url: page.url,
                frequency: data.frequency,
                positions: data.positions,
              },
            },
          },

          upsert: true,
        },
      });
    }

    if (operations.length) {
      await InvertedIndex.bulkWrite(operations);
    }

    // -----------------------------
    // Update document frequency
    // -----------------------------

    const dfOperations = [];

    for (const term of terms.keys()) {
      dfOperations.push({
        updateOne: {
          filter: {
            term,
          },

          update: [
            {
              $set: {
                documentFrequency: {
                  $size: "$postings",
                },
              },
            },
          ],
        },
      });
    }

    if (dfOperations.length) {
      await InvertedIndex.bulkWrite(dfOperations);
    }

    // -----------------------------
    // Return statistics
    // -----------------------------

    return {
      indexed: true,

      documentLength: tokens.length,

      uniqueTerms: terms.size,
    };
  }
}

export default new IndexService();
