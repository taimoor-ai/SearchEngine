import tokenizer from "./tokenizer.js";
import stopWords from "./stopWords.js";
import stemmer from "./stemmer.js";

class Preprocessor {
  process(text) {
    let tokens = tokenizer.tokenize(text);

    tokens = stopWords.remove(tokens);

    tokens = stemmer.stem(tokens);

    return tokens;
  }
}

export default new Preprocessor();