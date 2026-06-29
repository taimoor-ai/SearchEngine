import preprocessor from "../indexer/preprocessor.js";

class QueryProcessor {
  process(query = "") {
    if (!query || typeof query !== "string") {
      return [];
    }

    return preprocessor.process(query);
  }
}

export default new QueryProcessor();