import { escapeRegExp } from "./utils.js";

const phraseRewrites = [
  ["The rapid development of", "Recent progress in"],
  ["The rapid advancement of", "Recent advances in"],
  ["rapid advancement", "recent progress"],
  ["significantly transformed", "substantially changed"],
  ["has attracted considerable attention", "has become a frequent focus of scholarly work"],
  ["in recent years", "over the past several years"],
  ["Many researchers have proposed various methods", "Researchers have introduced a range of methods"],
  ["This paper presents a comprehensive analysis", "This work provides a focused analysis"],
  ["This study aims to develop", "This study develops"],
  ["This research focuses on", "This research examines"],
  ["intelligent framework", "automated framework"],
  ["existing literature", "published research"],
  ["advantages and disadvantages", "strengths and limitations"],
  ["The results show that", "The results indicate that"],
  ["The results indicate that", "The analysis indicates that"],
  ["the proposed method", "the method proposed here"],
  ["traditional techniques", "conventional techniques"],
  ["existing methods", "current methods"],
  ["In conclusion", "Overall"],
  ["Furthermore, the proposed system", "The proposed system also"],
  ["the findings of this study provide useful insights", "the study's findings offer useful insight"],
  ["future research", "subsequent research"],
  ["plays an important role", "has an important role"],
  ["crucial role", "central role"],
  ["significant improvement", "meaningful improvement"],
  ["substantial improvement", "clear improvement"],
  ["widely used", "commonly used"],
  ["state of the art", "current best-performing"],
  ["novel approach", "new approach"],
  ["real-world applications", "practical applications"],
  ["real world applications", "practical applications"],
  ["efficient, scalable, and reliable", "efficient and scalable"],
  ["supports sustainable decision-making", "supports sustainability-focused decisions"],
  ["enhances classification accuracy", "improves classification accuracy"],
  ["operational efficiency", "process efficiency"],
  ["manual effort", "manual workload"],
  ["current challenges", "present challenges"],
  ["sustainable solution", "sustainability-focused solution"],
  ["with the advancement of", "as advances in"],
  ["with the development of", "as development in"],
  ["has become a major", "has become a central"],
  ["has become an important", "has become a notable"],
  ["one of the most", "a particularly"],
  ["a wide range of", "several"],
  ["a variety of", "several"],
  ["it is important to note that", ""],
  ["it should be noted that", ""],
  ["the purpose of this", "this"],
  ["the objective of this", "this"],
  ["this work aims to", "this work"],
  ["this project aims to", "this project"],
  ["the proposed work", "this work"],
  ["the proposed model", "this model"],
  ["the proposed framework", "this framework"],
  ["the proposed technique", "this technique"],
  ["the main contribution of", "a contribution of"],
  ["valuable insights", "useful insight"],
  ["meaningful insights", "useful insight"],
  ["highly efficient", "efficient"],
  ["more efficient", "improved"],
  ["more accurate", "improved"],
  ["user-friendly", "accessible"],
  ["user friendly", "accessible"],
  ["easy to use", "accessible"],
  ["reduces human effort", "reduces manual work"],
  ["minimizes human error", "reduces manual error"],
  ["environmental sustainability", "sustainable environmental practice"],
  ["data-driven", "data-based"],
  ["data driven", "data-based"],
  ["decision making", "decision-making"],
  ["plays a vital role", "has a central role"],
];

const lexicalRewrites = [
  ["utilize", "use"],
  ["utilizes", "uses"],
  ["demonstrates", "shows"],
  ["therefore", "thus"],
  ["various", "several"],
  ["important", "central"],
  ["advanced", "developed"],
  ["innovative", "new"],
  ["comprehensive", "broad"],
  ["robust", "stable"],
  ["scalable", "expandable"],
  ["reliable", "consistent"],
  ["efficient", "effective"],
  ["enhances", "improves"],
  ["enables", "allows"],
  ["ensures", "supports"],
  ["contributes to", "supports"],
  ["significant", "clear"],
  ["substantial", "clear"],
  ["modern", "current"],
  ["technology", "technical method"],
  ["technologies", "technical methods"],
  ["framework", "structure"],
  ["methodology", "method"],
  ["implementation", "development"],
  ["optimization", "improvement"],
  ["classification accuracy", "classification performance"],
  ["operational efficiency", "process efficiency"],
  ["real-time", "live"],
  ["real time", "live"],
];

export function rewriteLatex(text, analysis, options) {
  const selected = analysis.sentences.filter((item) => item.level === "HIGH" || (options.includeMedium && item.level === "MEDIUM"));
  let output = "";
  let cursor = 0;
  let changes = 0;
  let skipped = 0;

  for (const sentence of selected) {
    const original = text.slice(sentence.start, sentence.end);
    const rewritten = rewriteRangePreservingLatex(text, sentence, analysis.mask, options.depth);
    output += text.slice(cursor, sentence.start);
    output += rewritten;
    cursor = sentence.end;
    if (rewritten !== original) changes += 1;
    if (rewritten === original && analysis.mask.slice(sentence.start, sentence.end).some(Boolean)) skipped += 1;
  }

  output += text.slice(cursor);
  return { output, changes, skipped };
}

function rewriteSentence(sentence, depth) {
  return rewritePlainText(sentence.text, depth);
}

function rewriteRangePreservingLatex(text, sentence, mask, depth) {
  const original = text.slice(sentence.start, sentence.end);
  if (!mask.slice(sentence.start, sentence.end).some(Boolean)) {
    return rewritePlainText(original, depth);
  }

  let result = "";
  let cursor = sentence.start;

  while (cursor < sentence.end) {
    const protectedNow = mask[cursor];
    let next = cursor + 1;
    while (next < sentence.end && mask[next] === protectedNow) next += 1;
    const chunk = text.slice(cursor, next);
    result += protectedNow ? chunk : rewriteTextChunk(chunk, depth);
    cursor = next;
  }

  return normalizeSpacingAroundProtected(result);
}

function rewriteTextChunk(chunk, depth) {
  if (!/[A-Za-z]{4}/.test(chunk)) return chunk;
  return rewritePlainText(chunk, depth);
}

function rewritePlainText(value, depth) {
  const leading = value.match(/^\s*/)[0];
  const trailing = value.match(/\s*$/)[0];
  let next = value.slice(leading.length, value.length - trailing.length);

  for (const [from, to] of phraseRewrites) {
    next = next.replace(new RegExp(escapeRegExp(from), "gi"), matchCase(to, next.match(new RegExp(escapeRegExp(from), "i"))?.[0] || from));
  }

  for (const [from, to] of lexicalRewrites) {
    next = next.replace(new RegExp(`\\b${escapeRegExp(from)}\\b`, "gi"), matchCase(to, next.match(new RegExp(`\\b${escapeRegExp(from)}\\b`, "i"))?.[0] || from));
  }

  next = rewriteCommonAcademicTemplates(next);

  if (depth !== "light") next = mediumRestructure(next);
  if (depth === "deep") {
    next = deepRestructure(next);
  }

  next = cleanupText(next);
  return leading + next + trailing;
}

function matchCase(replacement, original) {
  return /^[A-Z]/.test(original) ? replacement.charAt(0).toUpperCase() + replacement.slice(1) : replacement;
}

function rewriteCommonAcademicTemplates(text) {
  return text
    .replace(/^This paper presents\b/i, "This paper provides")
    .replace(/^This study aims to\b/i, "This study")
    .replace(/^This research focuses on\b/i, "This research examines")
    .replace(/^The results show that\b/i, "The results indicate that")
    .replace(/^The results indicate that\b/i, "The analysis indicates that")
    .replace(/^In conclusion,\s*/i, "Overall, ")
    .replace(/^Furthermore,\s*/i, "In addition, ")
    .replace(/^Moreover,\s*/i, "Also, ")
    .replace(/^However,\s*/i, "Nevertheless, ");
}

function mediumRestructure(text) {
  return text
    .replace(/\bThis paper\b/g, "This work")
    .replace(/\bThis study\b/g, "The study")
    .replace(/\bshows that\b/gi, "indicates that")
    .replace(/\bin order to\b/gi, "to")
    .replace(/\bdue to\b/gi, "because of")
    .replace(/\bwith the help of\b/gi, "using")
    .replace(/\bcan be used to\b/gi, "can")
    .replace(/\bis capable of\b/gi, "can")
    .replace(/\bare capable of\b/gi, "can")
    .replace(/\bis designed to\b/gi, "is built to")
    .replace(/\bare designed to\b/gi, "are built to");
}

function deepRestructure(text) {
  let next = text
    .replace(/^(.+?) has become (.+?) due to (.+?)\.$/i, "$3 has made $1 $2.")
    .replace(/^(.+?) provides (.+?) for (.+?)\.$/i, "$1 offers $2 for $3.")
    .replace(/^(.+?) improves (.+?) and supports (.+?)\.$/i, "$1 improves $2 while supporting $3.")
    .replace(/^(.+?) reduces (.+?) and (.+?)\.$/i, "$1 reduces $2 while $3.")
    .replace(/\bbetter accuracy than\b/gi, "higher accuracy than")
    .replace(/\buseful insight for\b/gi, "practical insight for");

  if (next === text && text.length > 90 && text.includes(", and ")) {
    next = text.replace(", and ", " while ");
  }
  return next;
}

function cleanupText(text) {
  return text
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .replace(/,\s*,/g, ",")
    .replace(/^\s*,\s*/, "")
    .replace(/\bThis work provides a broad analysis\b/gi, "This work provides an analysis")
    .trim();
}

function normalizeSpacingAroundProtected(text) {
  return text
    .replace(/[ \t]+(\\(?:cite|citet|citep|ref|eqref|label)\b)/g, " $1")
    .replace(/(\\(?:cite|citet|citep|ref|eqref)\{[^}]+\})[ \t]+([,.])/g, "$1$2")
    .replace(/[ \t]{2,}/g, " ");
}
