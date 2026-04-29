const input = document.querySelector("#latexInput");
const checkerTab = document.querySelector("#checkerTab");
const removerTab = document.querySelector("#removerTab");
const runButton = document.querySelector("#runButton");
const copyOutput = document.querySelector("#copyOutput");
const loadSample = document.querySelector("#loadSample");
const highlightedOutput = document.querySelector("#highlightedOutput");
const riskList = document.querySelector("#riskList");
const scoreValue = document.querySelector("#scoreValue");
const flaggedCount = document.querySelector("#flaggedCount");
const protectedCount = document.querySelector("#protectedCount");
const latexStatus = document.querySelector("#latexStatus");
const warningBox = document.querySelector("#warningBox");
const checkerView = document.querySelector("#checkerView");
const removerView = document.querySelector("#removerView");
const originalOutput = document.querySelector("#originalOutput");
const rewrittenOutput = document.querySelector("#rewrittenOutput");
const outputTitle = document.querySelector("#outputTitle");
const outputSubtitle = document.querySelector("#outputSubtitle");
const rewriteControls = document.querySelector("#rewriteControls");
const rewriteDepth = document.querySelector("#rewriteDepth");
const includeMedium = document.querySelector("#includeMedium");

const sampleLatex = String.raw`\section{Related Work}
The rapid development of machine learning has attracted considerable attention in recent years. Many researchers have proposed various methods to improve the performance of classification models \cite{smith2023}. This paper presents a comprehensive analysis of the existing literature and discusses the advantages and disadvantages of the proposed approach.

\begin{equation}
  E = mc^2
\end{equation}

The results show that the proposed method achieves better accuracy than traditional techniques. In conclusion, the findings of this study provide useful insights for future research.`;

const genericPhrases = [
  "attracted considerable attention",
  "in recent years",
  "many researchers have proposed",
  "several studies have",
  "previous studies have",
  "this paper presents",
  "this research focuses",
  "this study aims",
  "comprehensive analysis",
  "advantages and disadvantages",
  "results show that",
  "experimental results",
  "proposed method",
  "proposed system",
  "proposed approach",
  "traditional techniques",
  "existing methods",
  "in conclusion",
  "findings of this study",
  "future research",
  "plays an important role",
  "crucial role",
  "significant improvement",
  "substantial improvement",
  "widely used",
  "state of the art",
  "novel approach",
  "existing literature",
  "real world applications",
  "real-world applications",
  "current scenario",
  "main objective",
  "primary objective",
  "it can be observed",
  "it is evident",
  "this indicates that",
  "the main aim",
  "the overall performance",
  "provides an efficient",
  "sustainable solution",
  "modern technologies",
  "rapid growth",
  "rapid advancement",
];

const academicFillers = [
  "approach",
  "analysis",
  "challenge",
  "development",
  "efficiency",
  "framework",
  "implementation",
  "improvement",
  "insight",
  "limitation",
  "method",
  "objective",
  "performance",
  "process",
  "research",
  "result",
  "solution",
  "strategy",
  "system",
  "technology",
];

const aiStyleMarkers = [
  "additionally",
  "furthermore",
  "moreover",
  "therefore",
  "however",
  "overall",
  "in addition",
  "as a result",
  "due to",
  "enables",
  "ensures",
  "enhances",
  "supports",
  "contributes",
  "designed to",
  "capable of",
  "suitable for",
  "effective",
  "efficient",
  "robust",
  "scalable",
  "reliable",
  "seamless",
];

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

const state = {
  mode: "checker",
  lastOutput: "",
};

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function protectRange(mask, start, end) {
  for (let i = Math.max(0, start); i < Math.min(mask.length, end); i += 1) {
    mask[i] = true;
  }
}

function findClosingBrace(text, openIndex) {
  let depth = 0;
  for (let i = openIndex; i < text.length; i += 1) {
    const char = text[i];
    if (char === "\\" && i + 1 < text.length) {
      i += 1;
      continue;
    }
    if (char === "{") depth += 1;
    if (char === "}") depth -= 1;
    if (depth === 0) return i;
  }
  return -1;
}

function buildLatexMask(text) {
  const mask = Array(text.length).fill(false);
  const protectedCommands = new Set([
    "cite",
    "citet",
    "citep",
    "ref",
    "eqref",
    "label",
    "url",
    "href",
    "includegraphics",
    "bibliography",
    "bibliographystyle",
    "begin",
    "end",
    "input",
    "include",
  ]);
  const mathEnvironments = new Set(["equation", "align", "align*", "gather", "gather*", "multline", "multline*"]);

  for (let i = 0; i < text.length; i += 1) {
    if (text[i] === "%") {
      const end = text.indexOf("\n", i);
      protectRange(mask, i, end === -1 ? text.length : end);
      i = end === -1 ? text.length : end;
      continue;
    }

    if (text.startsWith("$$", i)) {
      const end = text.indexOf("$$", i + 2);
      protectRange(mask, i, end === -1 ? text.length : end + 2);
      i = end === -1 ? text.length : end + 1;
      continue;
    }

    if (text[i] === "$") {
      const end = findUnescaped(text, "$", i + 1);
      protectRange(mask, i, end === -1 ? text.length : end + 1);
      i = end === -1 ? text.length : end;
      continue;
    }

    if (text.startsWith("\\(", i) || text.startsWith("\\[", i)) {
      const close = text.startsWith("\\(", i) ? "\\)" : "\\]";
      const end = text.indexOf(close, i + 2);
      protectRange(mask, i, end === -1 ? text.length : end + 2);
      i = end === -1 ? text.length : end + 1;
      continue;
    }

    if (text[i] === "\\") {
      const commandMatch = text.slice(i).match(/^\\([a-zA-Z*]+|.)/);
      if (!commandMatch) continue;
      const command = commandMatch[1];
      const commandEnd = i + commandMatch[0].length;
      protectRange(mask, i, commandEnd);

      if (command === "begin") {
        const braceStart = skipSpaces(text, commandEnd);
        if (text[braceStart] === "{") {
          const braceEnd = findClosingBrace(text, braceStart);
          const envName = braceEnd > braceStart ? text.slice(braceStart + 1, braceEnd) : "";
          if (mathEnvironments.has(envName)) {
            const closeTag = `\\end{${envName}}`;
            const envEnd = text.indexOf(closeTag, braceEnd + 1);
            protectRange(mask, i, envEnd === -1 ? text.length : envEnd + closeTag.length);
            i = envEnd === -1 ? text.length : envEnd + closeTag.length - 1;
            continue;
          }
        }
      }

      if (protectedCommands.has(command.replace("*", ""))) {
        let cursor = commandEnd;
        cursor = protectOptionalArgs(text, mask, cursor);
        cursor = protectRequiredArgs(text, mask, cursor);
        i = Math.max(i, cursor - 1);
      }
    }
  }

  for (let i = 0; i < text.length; i += 1) {
    if ("{}[]".includes(text[i])) mask[i] = true;
  }

  return mask;
}

function findUnescaped(text, needle, fromIndex) {
  for (let i = fromIndex; i < text.length; i += 1) {
    if (text[i] === needle && text[i - 1] !== "\\") return i;
  }
  return -1;
}

function skipSpaces(text, index) {
  let cursor = index;
  while (cursor < text.length && /\s/.test(text[cursor])) cursor += 1;
  return cursor;
}

function protectOptionalArgs(text, mask, index) {
  let cursor = skipSpaces(text, index);
  while (text[cursor] === "[") {
    const end = findBalanced(text, cursor, "[", "]");
    protectRange(mask, cursor, end === -1 ? text.length : end + 1);
    cursor = skipSpaces(text, end === -1 ? text.length : end + 1);
  }
  return cursor;
}

function protectRequiredArgs(text, mask, index) {
  let cursor = skipSpaces(text, index);
  while (text[cursor] === "{") {
    const end = findClosingBrace(text, cursor);
    protectRange(mask, cursor, end === -1 ? text.length : end + 1);
    cursor = skipSpaces(text, end === -1 ? text.length : end + 1);
  }
  return cursor;
}

function findBalanced(text, openIndex, openChar, closeChar) {
  let depth = 0;
  for (let i = openIndex; i < text.length; i += 1) {
    if (text[i] === "\\" && i + 1 < text.length) {
      i += 1;
      continue;
    }
    if (text[i] === openChar) depth += 1;
    if (text[i] === closeChar) depth -= 1;
    if (depth === 0) return i;
  }
  return -1;
}

function extractTextRuns(text, mask) {
  const runs = [];
  let value = "";
  let map = [];
  let pendingProtectedSpace = false;

  const flush = () => {
    if (!/[A-Za-z]{3}/.test(value)) {
      value = "";
      map = [];
      pendingProtectedSpace = false;
      return;
    }
    runs.push({ text: value, map });
    value = "";
    map = [];
    pendingProtectedSpace = false;
  };

  for (let i = 0; i < text.length; i += 1) {
    if (mask[i]) {
      pendingProtectedSpace = true;
      continue;
    }

    const char = text[i];
    const previousChar = text[i - 1] || "";
    const nextChar = text[i + 1] || "";
    const blankLine = char === "\n" && previousChar === "\n";
    const commandBoundary = char === "\\" && /^\\(section|subsection|subsubsection|chapter|paragraph|item|caption|title|author)\b/.test(text.slice(i));

    if (blankLine || commandBoundary) {
      flush();
    }

    if (pendingProtectedSpace && value && !/\s$/.test(value)) {
      value += " ";
      map.push(null);
    }
    pendingProtectedSpace = false;

    if (/\s/.test(char)) {
      if (value && !/\s$/.test(value)) {
        value += " ";
        map.push(i);
      }
      continue;
    }

    value += char;
    map.push(i);

    if (/[.!?]/.test(char) && nextChar === "\n") {
      value += " ";
      map.push(null);
    }
  }

  flush();
  return runs;
}

function splitSentences(runs) {
  const sentences = [];
  for (const run of runs) {
    const pattern = /[^.!?]+[.!?]+(?:["')\]]+)?|[^.!?]+$/g;
    let match;
    while ((match = pattern.exec(run.text))) {
      const raw = match[0];
      const leading = raw.match(/^\s*/)[0].length;
      const trailing = raw.match(/\s*$/)[0].length;
      const sentenceText = raw.slice(leading, raw.length - trailing);
      if (sentenceText.split(/\s+/).filter(Boolean).length < 4) continue;
      const localStart = match.index + leading;
      const localEnd = match.index + raw.length - trailing;
      const start = firstMappedIndex(run.map, localStart, localEnd);
      const end = lastMappedIndex(run.map, localStart, localEnd);
      if (start === -1 || end === -1) continue;
      sentences.push({
        text: sentenceText,
        start,
        end: end + 1,
      });
    }
  }
  return sentences;
}

function firstMappedIndex(map, start, end) {
  for (let i = start; i < end; i += 1) {
    if (Number.isInteger(map[i])) return map[i];
  }
  return -1;
}

function lastMappedIndex(map, start, end) {
  for (let i = end - 1; i >= start; i -= 1) {
    if (Number.isInteger(map[i])) return map[i];
  }
  return -1;
}

function analyzeSentence(sentence, context = {}) {
  const lower = sentence.text.toLowerCase();
  const words = lower.match(/[a-z]{3,}/g) || [];
  const unique = new Set(words);
  const genericMatches = genericPhrases.filter((phrase) => lower.includes(phrase));
  const fillerHits = words.filter((word) => academicFillers.includes(word)).length;
  const markerMatches = aiStyleMarkers.filter((marker) => lower.includes(marker));
  const lexicalRepetition = words.length ? 1 - unique.size / words.length : 0;
  const stopwordHits = words.filter((word) =>
    [
      "the",
      "and",
      "that",
      "with",
      "from",
      "this",
      "into",
      "their",
      "which",
      "where",
      "while",
      "using",
      "such",
      "also",
      "these",
      "those",
      "through",
      "between",
    ].includes(word),
  ).length;
  const stopwordRatio = words.length ? stopwordHits / words.length : 0;
  const specificSignals = (sentence.text.match(/\\cite|\\ref|\[[0-9,\s-]+\]|\b[A-Z]{2,}\b|[0-9]+(?:\.[0-9]+)?%?/g) || []).length;
  const academicTemplate =
    /\b(this paper|this study|this research|the results|in conclusion|we propose|it is shown|it can be seen|the proposed|the system|the model|the method)\b/i.test(
      sentence.text,
    );
  const passiveTemplate = /\b(is|are|was|were|has been|have been|can be|could be|may be)\s+\w+ed\b/i.test(sentence.text);
  const abstractClaim = /\b(improve|enhance|increase|reduce|optimize|support|provide|enable|ensure|achieve|address|contribute)\w*\b/i.test(sentence.text);
  const broadOutcome = /\b(efficiency|accuracy|performance|sustainability|decision-making|management|quality|reliability|scalability)\b/i.test(sentence.text);

  let score = context.academicDensity > 0.22 ? 18 : 12;
  score += Math.min(genericMatches.length * 18, 54);
  score += Math.min(markerMatches.length * 7, 28);
  score += Math.min(fillerHits * 3, 18);
  score += words.length > 16 ? 8 : 0;
  score += words.length > 24 ? 10 : 0;
  score += words.length > 34 ? 9 : 0;
  score += lexicalRepetition > 0.28 ? 10 : 0;
  score += stopwordRatio > 0.36 && words.length > 14 ? 8 : 0;
  score += academicTemplate ? 16 : 0;
  score += passiveTemplate ? 9 : 0;
  score += abstractClaim && broadOutcome ? 14 : 0;
  score += context.transitionDensity > 0.18 ? 8 : 0;
  score -= Math.min(specificSignals * 5, 16);
  score = Math.max(0, Math.min(100, Math.round(score)));

  const level = score >= 66 ? "HIGH" : score >= 32 ? "MEDIUM" : "LOW";
  const explanation = buildExplanation({
    genericMatches,
    markerMatches,
    fillerHits,
    academicTemplate,
    passiveTemplate,
    abstractClaim,
    broadOutcome,
    wordCount: words.length,
    specificSignals,
  });
  return { ...sentence, score, level, explanation };
}

function buildExplanation(details) {
  const {
    genericMatches,
    markerMatches,
    fillerHits,
    academicTemplate,
    passiveTemplate,
    abstractClaim,
    broadOutcome,
    wordCount,
    specificSignals,
  } = details;
  const parts = [];
  if (genericMatches.length) parts.push(`Matches common academic phrasing: ${genericMatches.slice(0, 2).join(", ")}.`);
  if (markerMatches.length) parts.push(`Uses AI-like transition or polish markers: ${markerMatches.slice(0, 2).join(", ")}.`);
  if (fillerHits >= 2) parts.push("Contains broad academic nouns with limited concrete detail.");
  if (academicTemplate) parts.push("Uses a familiar paper-summary sentence pattern.");
  if (passiveTemplate) parts.push("Contains generic passive construction.");
  if (abstractClaim && broadOutcome) parts.push("Makes a broad improvement claim without much source-specific detail.");
  if (wordCount > 30) parts.push("Long sentence with broad scholarly wording.");
  if (specificSignals >= 2 && parts.length) parts.push("Specific citations, numbers, or acronyms reduce the final risk slightly.");
  return parts.length ? parts.join(" ") : "Lower risk: wording is compact or contains more specific details.";
}

function analyzeLatex(text) {
  const warnings = validateLatex(text);
  const mask = buildLatexMask(text);
  const runs = extractTextRuns(text, mask);
  const rawSentences = splitSentences(runs);
  const context = buildAnalysisContext(rawSentences);
  const sentences = rawSentences.map((sentence) => analyzeSentence(sentence, context));
  const flagged = sentences.filter((item) => item.level !== "LOW");
  const highCount = flagged.filter((item) => item.level === "HIGH").length;
  const weighted = sentences.length ? sentences.reduce((sum, item) => sum + item.score, 0) / sentences.length : 0;
  const flaggedRatio = sentences.length ? flagged.length / sentences.length : 0;
  const highRatio = sentences.length ? highCount / sentences.length : 0;
  const maxSentence = sentences.length ? Math.max(...sentences.map((item) => item.score)) : 0;
  const overall = Math.min(100, Math.round(weighted * 0.62 + flaggedRatio * 24 + highRatio * 18 + maxSentence * 0.18));
  const protectedChars = mask.filter(Boolean).length;
  return { warnings, mask, sentences, flagged, overall, protectedChars };
}

function buildAnalysisContext(sentences) {
  const words = sentences.flatMap((sentence) => sentence.text.toLowerCase().match(/[a-z]{3,}/g) || []);
  const fillerHits = words.filter((word) => academicFillers.includes(word)).length;
  const markerHits = aiStyleMarkers.reduce((sum, marker) => {
    const pattern = new RegExp(`\\b${escapeRegExp(marker)}\\b`, "gi");
    return sum + sentences.reduce((count, sentence) => count + (sentence.text.match(pattern) || []).length, 0);
  }, 0);

  return {
    academicDensity: words.length ? fillerHits / words.length : 0,
    transitionDensity: sentences.length ? markerHits / sentences.length : 0,
  };
}

function validateLatex(text) {
  const warnings = [];
  const begins = [...text.matchAll(/\\begin\{([^}]+)\}/g)].map((match) => match[1]);
  const ends = [...text.matchAll(/\\end\{([^}]+)\}/g)].map((match) => match[1]);
  const beginCounts = countByName(begins);
  const endCounts = countByName(ends);

  for (const [name, count] of Object.entries(beginCounts)) {
    if ((endCounts[name] || 0) !== count) warnings.push(`Environment "${name}" may be unbalanced.`);
  }
  for (const [name, count] of Object.entries(endCounts)) {
    if ((beginCounts[name] || 0) !== count) warnings.push(`Environment "${name}" has no matching begin.`);
  }

  const openBraces = (text.match(/\{/g) || []).length;
  const closeBraces = (text.match(/\}/g) || []).length;
  if (openBraces !== closeBraces) warnings.push("Curly braces may be unbalanced.");

  const dollarCount = (text.match(/(?<!\\)\$/g) || []).length;
  if (dollarCount % 2 !== 0) warnings.push("Inline math delimiters may be unbalanced.");

  return warnings;
}

function countByName(values) {
  return values.reduce((counts, value) => {
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {});
}

function renderHighlights(text, sentences) {
  const pieces = [];
  let cursor = 0;
  for (const sentence of sentences) {
    pieces.push(escapeHtml(text.slice(cursor, sentence.start)));
    const level = sentence.level.toLowerCase();
    pieces.push(
      `<span class="mark ${level}" title="${sentence.level} risk: ${escapeHtml(sentence.explanation)}">${escapeHtml(
        text.slice(sentence.start, sentence.end),
      )}</span><span class="inline-risk ${level}">${sentence.level}</span>`,
    );
    cursor = sentence.end;
  }
  pieces.push(escapeHtml(text.slice(cursor)));
  highlightedOutput.innerHTML = pieces.join("");
}

function renderRiskList(sentences) {
  const flagged = sentences.filter((item) => item.level !== "LOW");
  if (!flagged.length) {
    riskList.innerHTML = `<div class="risk-item risk-low"><strong><span class="label low">LOW</span> No plagiarism detected</strong><p>The original LaTeX can be used as-is.</p></div>`;
    return;
  }

  riskList.innerHTML = flagged
    .map((item) => {
      const level = item.level.toLowerCase();
      return `<article class="risk-item risk-${level}">
        <strong><span class="label ${level}">${item.level}</span> ${item.score}% sentence risk</strong>
        <p>${escapeHtml(item.explanation)}</p>
        <p>${escapeHtml(item.text)}</p>
      </article>`;
    })
    .join("");
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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

function rewriteLatex(text, analysis) {
  const selected = analysis.sentences.filter((item) => item.level === "HIGH" || (includeMedium.checked && item.level === "MEDIUM"));
  let output = "";
  let cursor = 0;
  let changes = 0;

  for (const sentence of selected) {
    const original = text.slice(sentence.start, sentence.end);
    if (analysis.mask.slice(sentence.start, sentence.end).some(Boolean)) continue;
    const rewritten = rewriteSentence(sentence, rewriteDepth.value);
    output += text.slice(cursor, sentence.start);
    output += rewritten;
    cursor = sentence.end;
    if (rewritten !== original) changes += 1;
  }

  output += text.slice(cursor);
  return { output, changes };
}

function setMode(mode) {
  state.mode = mode;
  const checker = mode === "checker";
  checkerTab.classList.toggle("active", checker);
  removerTab.classList.toggle("active", !checker);
  checkerTab.setAttribute("aria-selected", String(checker));
  removerTab.setAttribute("aria-selected", String(!checker));
  checkerView.hidden = !checker;
  removerView.hidden = checker;
  rewriteControls.hidden = checker;
  scoreStrip.hidden = !checker;
  outputTitle.textContent = checker ? "Checker Results" : "Remover Results";
  outputSubtitle.textContent = checker
    ? "Highlighted LaTeX preview and risk score."
    : "Full LaTeX output with only flagged sentences rewritten.";
}

function renderWarnings(warnings) {
  if (!warnings.length) {
    warningBox.hidden = true;
    warningBox.textContent = "";
    latexStatus.textContent = "LaTeX OK";
    return;
  }
  warningBox.hidden = false;
  warningBox.textContent = `Warning: ${warnings.join(" ")}`;
  latexStatus.textContent = "Check syntax";
}

function run() {
  const text = input.value.trimEnd();
  if (!text.trim()) {
    highlightedOutput.textContent = "";
    rewrittenOutput.textContent = "";
    riskList.innerHTML = "";
    state.lastOutput = "";
    scoreValue.textContent = "0%";
    flaggedCount.textContent = "0";
    protectedCount.textContent = "0";
    latexStatus.textContent = "Ready";
    return;
  }

  latexStatus.textContent = "Processing";
  const analysis = analyzeLatex(text);
  renderWarnings(analysis.warnings);
  protectedCount.textContent = String(analysis.protectedChars);

  if (state.mode === "checker") {
    renderHighlights(text, analysis.sentences);
    renderRiskList(analysis.sentences);
    scoreValue.textContent = `${analysis.overall}%`;
    flaggedCount.textContent = String(analysis.flagged.length);
    latexStatus.textContent = `Scanned ${analysis.sentences.length} sentences`;
    state.lastOutput = text;
  } else {
    const rewrite = rewriteLatex(text, analysis);
    originalOutput.textContent = text;
    rewrittenOutput.textContent = rewrite.output;
    state.lastOutput = rewrite.output;
    latexStatus.textContent = rewrite.changes ? `${rewrite.changes} changed` : "No changes";
  }
}

checkerTab.addEventListener("click", () => setMode("checker"));
removerTab.addEventListener("click", () => setMode("remover"));
runButton.addEventListener("click", run);
loadSample.addEventListener("click", () => {
  input.value = sampleLatex;
  run();
});

copyOutput.addEventListener("click", async () => {
  const output = state.mode === "checker" ? input.value : state.lastOutput;
  if (!output) return;
  await navigator.clipboard.writeText(output);
  const original = copyOutput.textContent;
  copyOutput.textContent = "Copied";
  setTimeout(() => {
    copyOutput.textContent = original;
  }, 1100);
});

input.value = sampleLatex;
setMode("checker");
run();
