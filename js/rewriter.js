import { escapeRegExp } from "./utils.js";

export async function rewriteLatex(text, analysis, options) {
  const selected = analysis.sentences.filter((item) => item.level === "HIGH" || (options.includeMedium && item.level === "MEDIUM"));
  let output = "";
  let cursor = 0;
  let changes = 0;
  let skipped = 0;

  for (const sentence of selected) {
    const original = text.slice(sentence.start, sentence.end);
    const rewritten = await rewriteRangePreservingLatex(text, sentence, analysis.mask, options.depth);
    output += text.slice(cursor, sentence.start);
    output += rewritten;
    cursor = sentence.end;
    if (rewritten !== original) changes += 1;
    if (rewritten === original && analysis.mask.slice(sentence.start, sentence.end).some(Boolean)) skipped += 1;
  }

  output += text.slice(cursor);
  return { output, changes, skipped };
}

async function rewriteRangePreservingLatex(text, sentence, mask, depth) {
  const original = text.slice(sentence.start, sentence.end);
  if (!mask.slice(sentence.start, sentence.end).some(Boolean)) {
    return await rewritePlainText(original, depth);
  }

  let result = "";
  let cursor = sentence.start;

  while (cursor < sentence.end) {
    const protectedNow = mask[cursor];
    let next = cursor + 1;
    while (next < sentence.end && mask[next] === protectedNow) next += 1;
    const chunk = text.slice(cursor, next);
    result += protectedNow ? chunk : await rewriteTextChunk(chunk, depth);
    cursor = next;
  }

  return normalizeSpacingAroundProtected(result);
}

async function rewriteTextChunk(chunk, depth) {
  if (!/[A-Za-z]{4}/.test(chunk)) return chunk;
  return await rewritePlainText(chunk, depth);
}

async function rewritePlainText(value, depth) {
  const leading = value.match(/^\s*/)[0];
  const trailing = value.match(/\s*$/)[0];
  const textToRewrite = value.trim();

  if (textToRewrite.length < 5) return value;

  const prompt = `Rewrite the following academic sentence to be more original and less generic, while maintaining its meaning and formal tone.
Rewrite Depth: ${depth} (light: minor changes, medium: significant restructuring, deep: complete paraphrase)
Original: "${textToRewrite}"
Respond ONLY with the rewritten sentence.`;

  try {
    const response = await puter.ai.chat(prompt);
    let rewritten = response.toString().trim();
    // Remove quotes if the AI added them
    rewritten = rewritten.replace(/^["']|["']$/g, "");
    return leading + rewritten + trailing;
  } catch (err) {
    console.error("AI Rewriting failed:", err);
    return value;
  }
}

function normalizeSpacingAroundProtected(text) {
  return text
    .replace(/[ \t]+(\\(?:cite|citet|citep|ref|eqref|label)\b)/g, " $1")
    .replace(/(\\(?:cite|citet|citep|ref|eqref)\{[^}]+\})[ \t]+([,.])/g, "$1$2")
    .replace(/[ \t]{2,}/g, " ");
}
