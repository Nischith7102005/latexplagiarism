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
];

export function rewriteLatex(text, analysis, options) {
  const selected = analysis.sentences.filter((item) => item.level === "HIGH" || (options.includeMedium && item.level === "MEDIUM"));
  let output = "";
  let cursor = 0;
  let changes = 0;
  let skipped = 0;

  for (const sentence of selected) {
    const original = text.slice(sentence.start, sentence.end);
    if (analysis.mask.slice(sentence.start, sentence.end).some(Boolean)) {
      skipped += 1;
      continue;
    }
    const rewritten = rewriteSentence(sentence, options.depth);
    output += text.slice(cursor, sentence.start);
    output += rewritten;
    cursor = sentence.end;
    if (rewritten !== original) changes += 1;
  }

  output += text.slice(cursor);
  return { output, changes, skipped };
}

function rewriteSentence(sentence, depth) {
  let next = sentence.text;
  for (const [from, to] of phraseRewrites) {
    next = next.replace(new RegExp(escapeRegExp(from), "gi"), matchCase(to, next.match(new RegExp(escapeRegExp(from), "i"))?.[0] || from));
  }

  if (depth !== "light") {
    next = next
      .replace(/\butilize\b/gi, "use")
      .replace(/\bdemonstrates\b/gi, "shows")
      .replace(/\btherefore\b/gi, "thus")
      .replace(/\bvarious\b/gi, "several")
      .replace(/\bimportant\b/gi, "central");
  }

  if (depth === "deep") {
    next = next
      .replace(/^The results indicate that/i, "The analysis indicates that")
      .replace(/^This work provides/i, "The present work provides")
      .replace(/\bbetter accuracy than\b/gi, "higher accuracy than")
      .replace(/\buseful insight for\b/gi, "practical insight for");
  }

  return next === sentence.text ? lightRestructure(next) : preserveCapitalization(sentence.text, next);
}

function matchCase(replacement, original) {
  return /^[A-Z]/.test(original) ? replacement.charAt(0).toUpperCase() + replacement.slice(1) : replacement;
}

function preserveCapitalization(original, replacement) {
  if (!original || !replacement) return replacement;
  return /^[A-Z]/.test(original) ? replacement.charAt(0).toUpperCase() + replacement.slice(1) : replacement;
}

function lightRestructure(text) {
  return text
    .replace(/\bThis paper\b/g, "This work")
    .replace(/\bThis study\b/g, "The study")
    .replace(/\bshows that\b/gi, "indicates that")
    .replace(/\bin order to\b/gi, "to");
}
