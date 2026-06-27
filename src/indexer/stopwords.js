// indexer/stopWords.js

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "has",
  "he",
  "in",
  "is",
  "it",
  "its",
  "of",
  "on",
  "that",
  "the",
  "to",
  "was",
  "were",
  "will",
  "with",
  "this",
  "these",
  "those",
  "or",
  "not",
  "if",
  "then",
  "than",
  "into",
  "about",
  "over",
  "under",
  "after",
  "before",
  "between",
  "during",
  "while",
  "can",
  "could",
  "should",
  "would",
  "have",
  "had",
  "having",
  "do",
  "does",
  "did",
  "doing",
  "you",
  "your",
  "we",
  "our",
  "they",
  "their",
  "i",
  "me",
  "my",
  "mine",
]);

class StopWordService {
  remove(tokens = []) {
    return tokens.filter(
      (token) => !STOP_WORDS.has(token)
    );
  }

  isStopWord(word = "") {
    return STOP_WORDS.has(word.toLowerCase());
  }
}

export default new StopWordService();