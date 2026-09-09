const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, 'focusbeacon.js');
const outputPath = path.join(__dirname, 'focusbeacon.min.js');

const source = fs.readFileSync(inputPath, 'utf8');

const tokens = [];
let remaining = source;

function capture(pattern, type) {
  const regex = new RegExp('^' + pattern, 's');
  const match = remaining.match(regex);
  if (match) {
    tokens.push({ type, value: match[0] });
    remaining = remaining.slice(match[0].length);
    return true;
  }
  return false;
}

while (remaining.length > 0) {
  if (capture('/\\*[\\s\\S]*?\\*/', 'comment')) continue;
  if (capture('//[^\\n\\r]*', 'line-comment')) continue;
  if (capture('"(?:\\\\"|[^"])*"', 'string')) continue;
  if (capture("'(?:\\\\'|[^'])*'", 'string')) continue;
  if (capture('`(?:\\\\`|[^`])*`', 'template')) continue;

  const whitespaceMatch = remaining.match(/^[\s]+/);
  if (whitespaceMatch) {
    tokens.push({ type: 'ws', value: whitespaceMatch[0] });
    remaining = remaining.slice(whitespaceMatch[0].length);
    continue;
  }

  const wordMatch = remaining.match(/^[A-Za-z0-9_$]+/);
  if (wordMatch) {
    tokens.push({ type: 'word', value: wordMatch[0] });
    remaining = remaining.slice(wordMatch[0].length);
    continue;
  }

  tokens.push({ type: 'char', value: remaining[0] });
  remaining = remaining.slice(1);
}

// Collapse whitespace tokens into a single marker and look ahead for next non-ws token.
const compact = [];
for (let i = 0; i < tokens.length; i++) {
  const token = tokens[i];
  if (token.type === 'comment' || token.type === 'line-comment') continue;

  if (token.type === 'ws') {
    let j = i + 1;
    while (j < tokens.length && tokens[j].type === 'ws') j++;
    const next = tokens[j];
    if (!next) continue;

    const prev = compact[compact.length - 1];
    const prevChar = prev ? prev.value.slice(-1) : '';
    const nextChar = next.value[0];
    const needsSpace =
      prev &&
      /^[A-Za-z0-9_$]$/.test(prevChar) &&
      /^[A-Za-z0-9_$]/.test(nextChar);

    if (needsSpace) {
      compact.push({ type: 'ws', value: ' ' });
    }
    continue;
  }

  compact.push(token);
}

let output = '';
let prev = null;

for (const token of compact) {
  if ((token.type === 'template' || token.type === 'string') && prev && prev.type === 'word') {
    output += ' ';
  }
  output += token.value;
  prev = token;
}

fs.writeFileSync(outputPath, output);
console.log(`Built ${outputPath} (${output.length} bytes)`);
