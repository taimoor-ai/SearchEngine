import tokenizer from "../indexer/tokenizer.js";
import stopWords from "../indexer/stopWords.js";

const text = `
The React framework is used for building modern web applications.
`;

const tokens = tokenizer.tokenize(text);

console.log(tokens);

const filtered = stopWords.remove(tokens);

console.log(filtered);