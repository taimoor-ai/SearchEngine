import preprocessor from "../indexer/preprocessor.js";

const text = `
Running runners run while studying studies.
`;

console.log(preprocessor.process(text));