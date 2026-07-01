// search/boost/boost.service.js
import queryProcessor from "../queryProcessor.js";
class BoostService {
  /**
   * Calculate all ranking boosts.
   */
  tokenize(text = "") {
    return queryProcessor.process(text);
  }

  containsTerm(tokens, term) {
    return tokens.includes(term);
  }
  calculate(page, queryTerms) {
    let score = 0;

    score += this.titleBoost(page, queryTerms);

    score += this.headingBoost(page, queryTerms);

    score += this.urlBoost(page, queryTerms);

    score += this.descriptionBoost(page, queryTerms);

    score += this.exactMatchBoost(page, queryTerms);

    return score;
  }

  //----------------------------------------
  // Title
  //----------------------------------------

  titleBoost(page, terms) {
    const tokens = this.tokenize(page.title);

    let score = 0;

    for (const term of terms) {
      if (this.containsTerm(tokens, term)) {
        score += 20;
      }
    }

    return score;
  }

  //----------------------------------------
  // Heading
  //----------------------------------------

  headingBoost(page, terms) {
    const tokens = this.tokenize(page.headings.join(" "));

    let score = 0;

    for (const term of terms) {
      if (this.containsTerm(tokens, term)) {
        score += 15;
      }
    }

    return score;
  }

  //----------------------------------------
  // URL
  //----------------------------------------

  urlBoost(page, terms) {
    const pathname = new URL(page.url).pathname.toLowerCase();

    const tokens = pathname.split(/[\/\-_]+/).filter(Boolean);

    let score = 0;

    for (const term of terms) {
      if (tokens.includes(term)) {
        score += 10;
      }
    }

    return score;
  }

  //----------------------------------------
  // Description
  //----------------------------------------

  descriptionBoost(page, terms) {
    const tokens = this.tokenize(page.description);

    let score = 0;

    for (const term of terms) {
      if (this.containsTerm(tokens, term)) {
        score += 5;
      }
    }

    return score;
  }

  //----------------------------------------
  // Exact Match
  //----------------------------------------

  exactMatchBoost(page, terms) {
    if (!terms.length) return 0;

    const query = terms.join(" ");

    const text = [
      page.title,
      ...(page.headings || []),
      page.description,
      page.content,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const tokens = this.tokenize(text);

    const phrase = terms.join(" ");

    return tokens.join(" ").includes(phrase) ? 40 : 0;
  }
}

export default new BoostService();
