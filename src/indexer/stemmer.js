// indexer/stemmer.js

import natural from "natural";

const { PorterStemmer } = natural;

class Stemmer {
  stem(tokens = []) {
    return tokens.map((token) =>
      PorterStemmer.stem(token)
    );
  }

  stemWord(word = "") {
    return PorterStemmer.stem(word);
  }
}

export default new Stemmer();