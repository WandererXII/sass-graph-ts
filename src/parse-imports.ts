import tokenizer from 'scss-tokenizer';

export function parseImports(content: string, isIndentedSyntax = false): string[] {
  const tokens: string[][] = tokenizer.tokenize(content);

  let results: string[] = [],
    tmp = '',
    inImport = false,
    isModern = false,
    inAsWith = false,
    inParen = false,
    prevToken = tokens[0];

  for (let i = 1; i < tokens.length; i++) {
    const token = tokens[i];

    if (inImport && !inParen && token[0] === 'string') {
      results.push(token[1]);
    } else if (
      (token[1] === 'import' || token[1] === 'use' || token[1] === 'forward') &&
      prevToken[1] === '@'
    ) {
      if (inImport && !isIndentedSyntax) {
        throw new Error('Encountered invalid @import syntax.');
      }

      inImport = true;
      isModern = token[1] === 'use' || token[1] === 'forward';
    } else if (inImport && !inParen && (token[0] === 'ident' || token[0] === '/')) {
      if (isModern && (token[1] === 'as' || token[1] === 'with')) inAsWith = true;
      else if (!inAsWith) tmp += token[1];
    } else if (inImport && !inParen && (token[0] === 'space' || token[0] === 'newline')) {
      if (tmp !== '') {
        results.push(tmp);
        tmp = '';

        if (isIndentedSyntax) {
          inImport = false;
          isModern = false;
          inAsWith = false;
        }
      }
    } else if (inImport && token[0] === ';') {
      inImport = false;
      isModern = false;
      inAsWith = false;

      if (tmp !== '') {
        results.push(tmp);
        tmp = '';
      }
    } else if (inImport && token[0] === '(') {
      inParen = true;
      tmp = '';
    } else if (inParen && token[0] === ')') {
      inParen = false;
    }

    prevToken = token;
  }

  if (tmp !== '') {
    results.push(tmp);
  }

  return results;
}
