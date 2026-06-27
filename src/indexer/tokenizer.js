// indexer/tokenizer.js

class Tokenizer {
  tokenize(text = "") {
    if (!text || typeof text !== "string") {
      return [];
    }

    return text
      .toLowerCase()

      // Remove HTML tags if any remain
      .replace(/<[^>]*>/g, " ")

      // Keep letters, numbers and spaces
      .replace(/[^\p{L}\p{N}\s]/gu, " ")

      // Collapse multiple spaces
      .replace(/\s+/g, " ")

      .trim()

      .split(" ")

      .filter(Boolean);
  }
}

export default new Tokenizer();