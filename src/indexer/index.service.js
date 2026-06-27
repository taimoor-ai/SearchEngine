import InvertedIndex from "../models/InvertedIndex.js";
import preprocessor from "./preprocessor.js";

class IndexService {
  async indexPage(page) {
    const tokens = preprocessor.process(page.content);

    if (!tokens.length) {
      return;
    }

    // term -> { frequency, positions }
    const terms = new Map();

    tokens.forEach((token, position) => {
      if (!terms.has(token)) {
        terms.set(token, {
          frequency: 0,
          positions: [],
        });
      }

      const entry = terms.get(token);

      entry.frequency++;
      entry.positions.push(position);
    });

    for (const [term, data] of terms) {
      await InvertedIndex.updateOne(
        { term },
        {
          $setOnInsert: {
            term,
          },

          $pull: {
            postings: {
              pageId: page._id,
            },
          },
        },
        {
          upsert: true,
        }
      );

      await InvertedIndex.updateOne(
        { term },
        {
          $push: {
            postings: {
              pageId: page._id,
              url: page.url,
              frequency: data.frequency,
              positions: data.positions,
            },
          },

          $inc: {
            documentFrequency: 1,
          },
        }
      );
    }
  }
}

export default new IndexService();