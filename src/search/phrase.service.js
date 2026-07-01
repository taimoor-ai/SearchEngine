// search/phrase.service.js

class PhraseService {
  /**
   * Returns true if all terms appear consecutively.
   */
  containsPhrase(postings = []) {
    if (!Array.isArray(postings) || postings.length < 2) {
      return false;
    }

    let currentPositions = postings[0].positions || [];

    for (let i = 1; i < postings.length; i++) {
      const nextPositions = postings[i].positions || [];

      // O(1) lookup
      const nextSet = new Set(nextPositions);

      const matched = [];

      for (const position of currentPositions) {
        const expected = position + 1;

        if (nextSet.has(expected)) {
          matched.push(expected);
        }
      }

      if (!matched.length) {
        return false;
      }

      currentPositions = matched;
    }

    return true;
  }

  /**
   * Proximity search.
   * Example:
   * react hooks~5
   */
  containsNear(postings = [], distance = 5) {
    if (!Array.isArray(postings) || postings.length < 2) {
      return false;
    }

    let current = postings[0].positions || [];

    for (let i = 1; i < postings.length; i++) {
      const next = postings[i].positions || [];

      const matched = [];

      for (const a of current) {
        for (const b of next) {
          if (Math.abs(a - b) <= distance) {
            matched.push(b);
          }
        }
      }

      if (!matched.length) {
        return false;
      }

      current = matched;
    }

    return true;
  }
}

export default new PhraseService();