// search/boolean/booleanParser.js

class BooleanParser {
  constructor() {
    this.operators = new Set([
      "AND",
      "OR",
      "NOT",
      "(",
      ")",
    ]);

    this.precedence = {
      NOT: 3,
      AND: 2,
      OR: 1,
    };
  }

  /**
   * Parse a Boolean query.
   */
  parse(query = "") {
    const tokens = this.tokenize(query);

    const normalized =
      this.insertImplicitAnd(tokens);

    const postfix =
      this.toPostfix(normalized);

    return {
      tokens: normalized,
      postfix,
    };
  }

  /**
   * -----------------------------------
   * Tokenizer
   * -----------------------------------
   */
  tokenize(query) {
    const regex =
      /"[^"]+"|\(|\)|\bAND\b|\bOR\b|\bNOT\b|[^\s()]+/gi;

    const tokens = [];

    let match;

    while ((match = regex.exec(query)) !== null) {
      const token = match[0];

      if (/^(AND|OR|NOT)$/i.test(token)) {
        tokens.push(token.toUpperCase());
      } else {
        tokens.push(token);
      }
    }

    return tokens;
  }

  /**
   * -----------------------------------
   * Insert implicit AND
   *
   * react hooks
   * =>
   * react AND hooks
   * -----------------------------------
   */
  insertImplicitAnd(tokens) {
    const result = [];

    for (let i = 0; i < tokens.length; i++) {
      const current = tokens[i];

      result.push(current);

      const next = tokens[i + 1];

      if (!next) continue;

      if (
        this.isOperand(current) &&
        this.isOperand(next)
      ) {
        result.push("AND");
      }

      if (
        this.isOperand(current) &&
        next === "("
      ) {
        result.push("AND");
      }

      if (
        current === ")" &&
        this.isOperand(next)
      ) {
        result.push("AND");
      }

      if (
        current === ")" &&
        next === "("
      ) {
        result.push("AND");
      }
    }

    return result;
  }

  /**
   * -----------------------------------
   * Convert infix -> postfix
   * (Shunting Yard)
   * -----------------------------------
   */
  toPostfix(tokens) {
    const output = [];
    const stack = [];

    for (const token of tokens) {
      if (this.isOperand(token)) {
        output.push(token);
        continue;
      }

      if (token === "(") {
        stack.push(token);
        continue;
      }

      if (token === ")") {
        while (
          stack.length &&
          stack[stack.length - 1] !== "("
        ) {
          output.push(stack.pop());
        }

        stack.pop();

        continue;
      }

      while (
        stack.length &&
        stack[stack.length - 1] !== "(" &&
        this.precedence[
          stack[stack.length - 1]
        ] >= this.precedence[token]
      ) {
        output.push(stack.pop());
      }

      stack.push(token);
    }

    while (stack.length) {
      output.push(stack.pop());
    }

    return output;
  }

  /**
   * -----------------------------------
   * Operand?
   * -----------------------------------
   */
  isOperand(token) {
    return !this.operators.has(token);
  }
}

export default new BooleanParser();