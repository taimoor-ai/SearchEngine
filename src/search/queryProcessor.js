import preprocessor from "../indexer/preprocessor.js";

class QueryProcessor {
  process(query = "") {
    if (!query || typeof query !== "string") {
      return [];
    }

    return preprocessor.process(query);
  }

  parse(query = "") {
    if (!query || typeof query !== "string") {
      return {
        terms: [],
        phrases: [],
      };
    }

    const phraseRegex = /"([^"]+)"/g;

    const phrases = [];

    let match;

    while ((match = phraseRegex.exec(query)) !== null) {
      const tokens = this.process(match[1]);

      if (tokens.length) {
        phrases.push(tokens);
      }
    }

    const remaining = query.replace(phraseRegex, " ");

    return {
      terms: this.process(remaining),
      phrases,
    };
  }
}

export default new QueryProcessor();