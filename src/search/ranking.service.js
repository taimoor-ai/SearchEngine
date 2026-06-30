// search/ranking.service.js

class RankingService {
  constructor() {
    this.k1 = 1.5;
    this.b = 0.75;
  }

  bm25({
    tf,
    df,
    totalDocuments,
    documentLength,
    averageDocumentLength,
  }) {
    const idf = Math.log(
      1 +
        (totalDocuments - df + 0.5) /
          (df + 0.5)
    );

    const numerator =
      tf * (this.k1 + 1);

    const denominator =
      tf +
      this.k1 *
        (1 -
          this.b +
          this.b *
            (documentLength /
              averageDocumentLength));

    return idf * (numerator / denominator);
  }
}

export default new RankingService();