import { escapeRegExp } from "./utils.js";

export const genericPhrases = [
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

const stopwords = new Set([
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
]);

export function scoreSentences(rawSentences) {
  const context = buildAnalysisContext(rawSentences);
  const sentences = rawSentences.map((sentence) => analyzeSentence(sentence, context));
  const flagged = sentences.filter((item) => item.level !== "LOW");
  const highCount = flagged.filter((item) => item.level === "HIGH").length;
  const weighted = sentences.length ? sentences.reduce((sum, item) => sum + item.score, 0) / sentences.length : 0;
  const flaggedRatio = sentences.length ? flagged.length / sentences.length : 0;
  const highRatio = sentences.length ? highCount / sentences.length : 0;
  const maxSentence = sentences.length ? Math.max(...sentences.map((item) => item.score)) : 0;
  const overall = Math.min(100, Math.round(weighted * 0.62 + flaggedRatio * 24 + highRatio * 18 + maxSentence * 0.18));

  return { sentences, flagged, overall };
}

function analyzeSentence(sentence, context = {}) {
  const lower = sentence.text.toLowerCase();
  const words = lower.match(/[a-z]{3,}/g) || [];
  const unique = new Set(words);
  const genericMatches = genericPhrases.filter((phrase) => lower.includes(phrase));
  const fillerHits = words.filter((word) => academicFillers.includes(word)).length;
  const markerMatches = aiStyleMarkers.filter((marker) => lower.includes(marker));
  const lexicalRepetition = words.length ? 1 - unique.size / words.length : 0;
  const stopwordHits = words.filter((word) => stopwords.has(word)).length;
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
