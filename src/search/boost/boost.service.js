// search/boost/boost.service.js

class BoostService {
  /**
   * Calculate all ranking boosts.
   */
  calculate(page, queryTerms) {
    let score = 0;

    score += this.titleBoost(page, queryTerms);

    score += this.headingBoost(page, queryTerms);

    score += this.urlBoost(page, queryTerms);

    score += this.descriptionBoost(
      page,
      queryTerms
    );

    score += this.exactMatchBoost(
      page,
      queryTerms
    );

    return score;
  }

  //----------------------------------------
  // Title
  //----------------------------------------

  titleBoost(page, terms) {
    if (!page.title) return 0;

    const title =
      page.title.toLowerCase();

    let score = 0;

    for (const term of terms) {
      if (title.includes(term)) {
        score += 20;
      }
    }

    return score;
  }

  //----------------------------------------
  // Heading
  //----------------------------------------

  headingBoost(page, terms) {
    if (!page.headings?.length) return 0;

    const headings =
      page.headings.join(" ").toLowerCase();

    let score = 0;

    for (const term of terms) {
      if (headings.includes(term)) {
        score += 15;
      }
    }

    return score;
  }

  //----------------------------------------
  // URL
  //----------------------------------------

  urlBoost(page, terms) {
    if (!page.url) return 0;

    const url =
      page.url.toLowerCase();

    let score = 0;

    for (const term of terms) {
      if (url.includes(term)) {
        score += 10;
      }
    }

    return score;
  }

  //----------------------------------------
  // Description
  //----------------------------------------

  descriptionBoost(page, terms) {
    if (!page.description) return 0;

    const description =
      page.description.toLowerCase();

    let score = 0;

    for (const term of terms) {
      if (
        description.includes(term)
      ) {
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

    const query =
      terms.join(" ");

    const text = [
      page.title,
      ...(page.headings || []),
      page.description,
      page.content,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return text.includes(query)
      ? 40
      : 0;
  }
}

export default new BoostService();