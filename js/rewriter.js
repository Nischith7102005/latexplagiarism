import { escapeRegExp } from "./utils.js";
import { genericPhrases, aiStyleMarkers, vagueAdjectives, conceptMap } from "./analyzer.js";

// Layer 1: Synonym swapping using concept map
const synonyms = {
  approach: ["method", "technique", "strategy"],
  technique: ["method", "approach", "way"],
  methodology: ["method", "approach", "procedure"],
  framework: ["structure", "system", "organization"],
  result: ["outcome", "finding", "conclusion"],
  finding: ["result", "insight", "observation"],
  study: ["investigation", "examination", "analysis"],
  paper: ["article", "work", "document"],
  improve: ["enhance", "advance", "optimize"],
  increase: ["enhance", "raise", "boost"],
  show: ["demonstrate", "reveal", "illustrate"],
  indicate: ["suggest", "demonstrate", "point to"],
  use: ["apply", "employ", "utilize"],
  effective: ["useful", "beneficial", "functional"],
  efficient: ["productive", "effective", "well-organized"],
  significant: ["notable", "meaningful", "important"],
  important: ["key", "vital", "crucial"],
  novel: ["new", "original", "innovative"],
  robust: ["strong", "reliable", "stable"],
  comprehensive: ["thorough", "complete", "detailed"],
};

// Layer 2: Generic phrase replacements
const genericReplacements = [
  [/in recent years/gi, "recently"],
  [/many researchers have/gi, "researchers have"],
  [/several studies have/gi, "studies have"],
  [/previous studies have/gi, "researchers have"],
  [/this paper presents/gi, "this work presents"],
  [/this research focuses/gi, "this work focuses"],
  [/this study aims/gi, "this investigation aims"],
  [/comprehensive analysis/gi, "analysis"],
  [/advantages and disadvantages/gi, "benefits and limitations"],
  [/proposed method/gi, "method"],
  [/proposed system/gi, "system"],
  [/proposed approach/gi, "approach"],
  [/traditional techniques/gi, "conventional methods"],
  [/existing methods/gi, "current methods"],
  [/in conclusion/gi, "finally"],
  [/plays an important role/gi, "is relevant"],
  [/crucial role/gi, "key role"],
  [/significant improvement/gi, "improvement"],
  [/widely used/gi, "commonly used"],
  [/state of the art/gi, "current"],
  [/novel approach/gi, "new approach"],
  [/real world applications/gi, "practical applications"],
  [/real-world applications/gi, "practical applications"],
  [/current scenario/gi, "present situation"],
  [/main objective/gi, "goal"],
  [/primary objective/gi, "main goal"],
  [/it can be observed/gi, "it is notable"],
  [/it is evident/gi, "notably"],
  [/the main aim/gi, "the aim"],
  [/the overall performance/gi, "performance"],
  [/provides an efficient/gi, "provides an effective"],
  [/sustainable solution/gi, "viable solution"],
  [/modern technologies/gi, "current technologies"],
  [/rapid growth/gi, "growth"],
  [/rapid advancement/gi, "advancement"],
  [/with the advancement/gi, "with advances"],
  [/with the development/gi, "with development"],
  [/has become a major/gi, "is a major"],
  [/has become an important/gi, "is an important"],
  [/one of the most/gi, "among the"],
  [/a wide range of/gi, "various"],
  [/a variety of/gi, "several"],
  [/it is important to note/gi, "notably"],
  [/it should be noted/gi, "note that"],
  [/the purpose of this/gi, "this"],
  [/the objective of this/gi, "this"],
  [/this work aims/gi, "this work addresses"],
  [/this project aims/gi, "this project addresses"],
  [/the proposed work/gi, "this work"],
  [/the proposed model/gi, "the model"],
  [/the proposed framework/gi, "the framework"],
  [/the proposed technique/gi, "the technique"],
  [/the main contribution/gi, "the contribution"],
  [/the main contributions/gi, "contributions"],
  [/the remainder of this paper/gi, "the rest of this work"],
  [/organized as follows/gi, "structured as follows"],
  [/as shown in/gi, "shown in"],
  [/as discussed above/gi, "discussed above"],
  [/as mentioned earlier/gi, "mentioned above"],
  [/better understanding/gi, "understanding"],
  [/valuable insights/gi, "useful insights"],
  [/meaningful insights/gi, "useful insights"],
  [/highly efficient/gi, "efficient"],
  [/more efficient/gi, "more effective"],
  [/more accurate/gi, "more precise"],
  [/real time/gi, "real-time"],
  [/real-time/gi, "real-time"],
  [/user friendly/gi, "usable"],
  [/user-friendly/gi, "usable"],
  [/easy to use/gi, "simple to use"],
  [/reduces human effort/gi, "reduces effort"],
  [/minimizes human error/gi, "reduces errors"],
  [/environmental sustainability/gi, "sustainability"],
  [/data driven/gi, "data-driven"],
  [/data-driven/gi, "data-driven"],
  [/decision making/gi, "decision-making"],
  [/decision-making/gi, "decision-making"],
  [/plays a vital role/gi, "is important"],
];

// Layer 3: AI style marker removals
const styleMarkerReplacements = [
  [/, additionally/gi, ""],
  [/, furthermore/gi, ""],
  [/, moreover/gi, ""],
  [/, overall/gi, ""],
  [/additionally,/gi, "also,"],
  [/furthermore,/gi, "also,"],
  [/moreover,/gi, "also,"],
  [/as a result,/gi, "therefore,"],
  [/due to/gi, "because of"],
  [/\benables\b/gi, "allows"],
  [/\bensures\b/gi, "guarantees"],
  [/\benhances\b/gi, "improves"],
  [/\bsupports\b/gi, "helps"],
  [/\bcontributes\b/gi, "adds"],
  [/\bdesigned to\b/gi, "intended to"],
  [/\bcapable of\b/gi, "able to"],
  [/\bsuitable for\b/gi, "appropriate for"],
  [/\bcutting-edge\b/gi, "advanced"],
];

function rewriteSentenceLocal(text, depth) {
  let result = text;

  // Apply generic phrase replacements
  for (const [pattern, replacement] of genericReplacements) {
    result = result.replace(pattern, replacement);
  }

  // Apply style marker removals
  for (const [pattern, replacement] of styleMarkerReplacements) {
    result = result.replace(pattern, replacement);
  }

  // Synonym swapping based on depth
  if (depth === "light") {
    // Light: only replace most common filler words
    result = result.replace(/\bmethod\b/gi, "approach");
    result = result.replace(/\bapproach\b/gi, "technique");
  } else if (depth === "medium") {
    // Medium: apply synonym swaps to more words
    const words = result.split(/\b/);
    const swapped = words.map((word) => {
      const lower = word.toLowerCase();
      if (synonyms[lower]) {
        const options = synonyms[lower];
        return options[Math.floor(Math.random() * options.length)];
      }
      return word;
    });
    result = swapped.join("");
  } else if (depth === "deep") {
    // Deep: aggressive synonym swapping and restructuring
    const words = result.split(/(\s+|\b)/);
    const swapped = words.map((word) => {
      const lower = word.toLowerCase().replace(/[^a-z]/g, "");
      if (synonyms[lower] && synonyms[lower].length > 0) {
        const options = synonyms[lower];
        const replacement = options[Math.floor(Math.random() * options.length)];
        return word.replace(new RegExp(escapeRegExp(lower), "gi"), replacement);
      }
      return word;
    });
    result = swapped.join("");

    // Remove vague adjectives
    for (const adj of vagueAdjectives) {
      const pattern = new RegExp(`\\b${adj}\\b\\s*`, "gi");
      result = result.replace(pattern, "");
    }

    // Simplify complex passive constructions
    result = result.replace(/\b(is|are|was|were|has been|have been)\s+(\w+ed)\b/gi, "$2");
  }

  // Clean up double spaces and trailing punctuation issues
  result = result.replace(/\s{2,}/g, " ").trim();

  // Capitalize first letter if needed
  if (result.length > 0) {
    result = result.charAt(0).toUpperCase() + result.slice(1);
  }

  return result;
}

export async function rewriteLatex(text, analysis, options) {
  const selected = analysis.sentences.filter((item) => item.level === "HIGH" || (options.includeMedium && item.level === "MEDIUM"));
  let output = "";
  let cursor = 0;
  let changes = 0;
  let skipped = 0;

  for (const sentence of selected) {
    const original = text.slice(sentence.start, sentence.end);
    const rewritten = await rewriteRangePreservingLatex(text, sentence, analysis.mask, options);
    output += text.slice(cursor, sentence.start);
    output += rewritten;
    cursor = sentence.end;
    if (rewritten !== original) changes += 1;
    if (rewritten === original && analysis.mask.slice(sentence.start, sentence.end).some(Boolean)) skipped += 1;
  }

  output += text.slice(cursor);
  return { output, changes, skipped };
}

async function rewriteRangePreservingLatex(text, sentence, mask, options) {
  const original = text.slice(sentence.start, sentence.end);
  if (!mask.slice(sentence.start, sentence.end).some(Boolean)) {
    return await rewritePlainText(original, options);
  }

  let result = "";
  let cursor = sentence.start;

  while (cursor < sentence.end) {
    const protectedNow = mask[cursor];
    let next = cursor + 1;
    while (next < sentence.end && mask[next] === protectedNow) next += 1;
    const chunk = text.slice(cursor, next);
    result += protectedNow ? chunk : await rewriteTextChunk(chunk, options);
    cursor = next;
  }

  return normalizeSpacingAroundProtected(result);
}

async function rewriteTextChunk(chunk, options) {
  if (!/[A-Za-z]{4}/.test(chunk)) return chunk;
  return await rewritePlainText(chunk, options);
}

async function rewritePlainText(value, options) {
  const leading = value.match(/^\s*/)[0];
  const trailing = value.match(/\s*$/)[0];
  const textToRewrite = value.trim();

  if (textToRewrite.length < 5) return value;

  // Use local multi-layer rewriting
  const rewritten = rewriteSentenceLocal(textToRewrite, options.depth);

  // If no change occurred with light/medium, try medium/deep for better results
  if (rewritten === textToRewrite && options.depth === "light") {
    const retry = rewriteSentenceLocal(textToRewrite, "medium");
    if (retry !== textToRewrite) return leading + retry + trailing;
  }

  return leading + rewritten + trailing;
}

function normalizeSpacingAroundProtected(text) {
  return text
    .replace(/[ \t]+(\\(?:cite|citet|citep|ref|eqref|label)\b)/g, " $1")
    .replace(/(\\(?:cite|citet|citep|ref|eqref)\{[^}]+\})[ \t]+([,.])/g, "$1$2")
    .replace(/[ \t]{2,}/g, " ");
}