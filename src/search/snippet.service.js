// search/snippet.service.js

import queryProcessor from "./queryProcessor.js";

class SnippetService {
  constructor() {
    this.contextChars = 120;
    this.maxSnippetLength = 260;
  }

  normalize(text = "") {
    return text.replace(/\s+/g, " ").trim();
  }

  findBestMatch(content, queryTerms) {
    const lower = content.toLowerCase();

    let bestIndex = -1;
    let bestScore = -1;

    for (const term of queryTerms) {
      const regex = new RegExp(`\\b${this.escapeRegex(term)}\\b`, "gi");

      let match;

      while ((match = regex.exec(lower)) !== null) {
        const start = Math.max(
          0,
          match.index - this.contextChars
        );

        const end = Math.min(
          content.length,
          match.index + this.contextChars
        );

        const window = lower.slice(start, end);

        let score = 0;

        for (const q of queryTerms) {
          const r = new RegExp(
            `\\b${this.escapeRegex(q)}\\b`,
            "i"
          );

          if (r.test(window)) {
            score++;
          }
        }

        if (score > bestScore) {
          bestScore = score;
          bestIndex = match.index;
        }
      }
    }

    return bestIndex;
  }

  highlight(snippet, queryTerms) {
    let output = snippet;

    for (const term of queryTerms) {
      const regex = new RegExp(
        `\\b(${this.escapeRegex(term)})\\b`,
        "gi"
      );

      output = output.replace(
        regex,
        "<mark>$1</mark>"
      );
    }

    return output;
  }

  escapeRegex(text) {
    return text.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );
  }

  generate(content = "", queryTerms = []) {
    if (!content) {
      return "";
    }

    const normalized =
      this.normalize(content);

    if (!queryTerms.length) {
      return (
        normalized.slice(
          0,
          this.maxSnippetLength
        ) + "..."
      );
    }

    //----------------------------------
    // Find best occurrence
    //----------------------------------

    const index =
      this.findBestMatch(
        normalized,
        queryTerms
      );

    //----------------------------------
    // No match
    //----------------------------------

    if (index === -1) {
      return (
        normalized.slice(
          0,
          this.maxSnippetLength
        ) + "..."
      );
    }

    //----------------------------------
    // Extract context
    //----------------------------------

    const start = Math.max(
      0,
      index - this.contextChars
    );

    const end = Math.min(
      normalized.length,
      index +
        this.contextChars +
        this.maxSnippetLength
    );

    let snippet =
      normalized.slice(start, end);

    snippet = this.highlight(
      snippet,
      queryTerms
    );

    if (start > 0) {
      snippet = "..." + snippet;
    }

    if (end < normalized.length) {
      snippet += "...";
    }

    return snippet;
  }
}

export default new SnippetService();