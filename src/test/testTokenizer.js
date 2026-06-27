import tokenizer from "../indexer/tokenizer.js";

const tokens = tokenizer.tokenize(`
React.js is       AWESOME!!!

Learn React 19 today.
`);

console.log(tokens);