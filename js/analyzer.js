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
  "with the advancement",
  "with the development",
  "has become a major",
  "has become an important",
  "one of the most",
  "a wide range of",
  "a variety of",
  "it is important to note",
  "it should be noted",
  "the purpose of this",
  "the objective of this",
  "this work aims",
  "this project aims",
  "the proposed work",
  "the proposed model",
  "the proposed framework",
  "the proposed technique",
  "the main contribution",
  "the main contributions",
  "the remainder of this paper",
  "organized as follows",
  "as shown in",
  "as discussed above",
  "as mentioned earlier",
  "better understanding",
  "valuable insights",
  "meaningful insights",
  "highly efficient",
  "more efficient",
  "more accurate",
  "real time",
  "real-time",
  "user friendly",
  "user-friendly",
  "easy to use",
  "reduces human effort",
  "minimizes human error",
  "environmental sustainability",
  "data driven",
  "data-driven",
  "decision making",
  "decision-making",
  "plays a vital role",
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
  "application",
  "capability",
  "classification",
  "contribution",
  "domain",
  "evaluation",
  "feature",
  "impact",
  "integration",
  "model",
  "problem",
  "requirement",
  "scope",
  "technique",
  "workflow",
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
  "comprehensive",
  "innovative",
  "intelligent",
  "advanced",
  "modern",
  "significant",
  "valuable",
  "meaningful",
  "enhanced",
  "optimized",
  "automated",
  "integrated",
  "state-of-the-art",
  "cutting-edge",
];

const vagueAdjectives = new Set([
  "advanced",
  "automated",
  "better",
  "comprehensive",
  "effective",
  "efficient",
  "enhanced",
  "important",
  "innovative",
  "intelligent",
  "meaningful",
  "modern",
  "novel",
  "optimized",
  "reliable",
  "robust",
  "scalable",
  "significant",
  "sustainable",
  "valuable",
  "various",
]);

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

const conceptMap = {
  approach: "method",
  technique: "method",
  methodology: "method",
  framework: "method",
  system: "method",
  strategy: "method",
  result: "outcome",
  finding: "outcome",
  consequence: "outcome",
  output: "outcome",
  effect: "outcome",
  impact: "outcome",
  study: "research",
  investigation: "research",
  analysis: "research",
  examination: "research",
  paper: "research",
  article: "research",
  work: "research",
  improve: "enhance",
  augment: "enhance",
  boost: "enhance",
  optimize: "enhance",
  elevate: "enhance",
  increase: "enhance",
  show: "demonstrate",
  indicate: "demonstrate",
  suggest: "demonstrate",
  prove: "demonstrate",
  reveal: "demonstrate",
  illustrate: "demonstrate",
  use: "utilize",
  employ: "utilize",
  apply: "utilize",
  harness: "utilize",
  leverage: "utilize",
  problem: "challenge",
  issue: "challenge",
  difficulty: "challenge",
  obstacle: "challenge",
  limitation: "challenge",
  showcase: "present",
  introduce: "present",
  describe: "present",
  discuss: "present",
};

function getNGrams(text, n = 3) {
  const words = text.toLowerCase().match(/[a-z]{3,}/g) || [];
  const ngrams = [];
  for (let i = 0; i <= words.length - n; i++) {
    ngrams.push(words.slice(i, i + n).join(" "));
  }
  return ngrams;
}

function getSemanticFingerprint(text) {
  const words = text.toLowerCase().match(/[a-z]{3,}/g) || [];
  return words
    .map((word) => conceptMap[word] || word)
    .filter((word) => !stopwords.has(word))
    .join(" ");
}

function getStructuralType(details) {
  const { academicTemplate, passiveTemplate, abstractClaim, introConclusionPattern } = details;
  let type = "";
  if (academicTemplate) type += "T";
  if (passiveTemplate) type += "P";
  if (abstractClaim) type += "C";
  if (introConclusionPattern) type += "I";
  return type || "N"; // N for Normal
}

export async function scoreSentences(rawSentences, useAI, onProgress) {
  const context = buildAnalysisContext(rawSentences);
  const sentences = [];
  const BATCH_SIZE = 10;
  let aiFailed = false;

  for (let i = 0; i < rawSentences.length; i += BATCH_SIZE) {
    const batch = rawSentences.slice(i, i + BATCH_SIZE);
    if (onProgress) {
      onProgress(`Analyzing sentences ${i + 1} to ${Math.min(i + BATCH_SIZE, rawSentences.length)}...`);
    }

    let aiResults = null;
    if (useAI && !aiFailed) {
      aiResults = await analyzeBatchWithAI(batch);
      if (aiResults === null) {
        aiFailed = true;
      }
    }

    batch.forEach((sentence, batchIdx) => {
      const localResult = analyzeSentenceLocal(sentence, i + batchIdx, context);

      if (aiResults && aiResults[batchIdx]) {
        const aiResult = aiResults[batchIdx];
        const combinedScore = Math.round(aiResult.score * 0.7 + localResult.score * 0.3);
        const level = combinedScore >= 56 ? "HIGH" : combinedScore >= 24 ? "MEDIUM" : "LOW";
        sentences.push({
          ...sentence,
          score: combinedScore,
          level: level,
          explanation: aiResult.explanation || localResult.explanation,
        });
      } else {
        sentences.push({
          ...sentence,
          score: localResult.score,
          level: localResult.level,
          explanation: localResult.explanation,
        });
      }
    });
  }

  const flagged = sentences.filter((item) => item.level !== "LOW");
  const highCount = flagged.filter((item) => item.level === "HIGH").length;
  const weighted = sentences.length ? sentences.reduce((sum, item) => sum + item.score, 0) / sentences.length : 0;
  const flaggedRatio = sentences.length ? flagged.length / sentences.length : 0;
  const highRatio = sentences.length ? highCount / sentences.length : 0;
  const maxSentence = sentences.length ? Math.max(...sentences.map((item) => item.score)) : 0;
  const strictDocumentPenalty = Math.min(18, context.repeatedStemDensity * 120 + context.genericPhraseDensity * 80);
  const overall = Math.min(100, Math.round(weighted * 0.7 + flaggedRatio * 28 + highRatio * 22 + maxSentence * 0.2 + strictDocumentPenalty));

  const warnings = [];
  if (aiFailed) {
    warnings.push("AI analysis unavailable, using local heuristics only.");
  }

  return { sentences, flagged, overall, warnings };
}

async function analyzeBatchWithAI(batch) {
  const prompt = `Act as an expert academic plagiarism and AI-content analyzer. 
Analyze the following ${batch.length} sentences extracted from a LaTeX document for plagiarism risk, "AI-like" genericness, and academic integrity.
Return ONLY a JSON array of objects, one for each sentence in the exact order provided.
Each object must have:
- "score": a number from 0 to 100 (where 0 is original/specific and 100 is highly generic/plagiarized/AI-generated)
- "explanation": a brief (one sentence) explanation of the risk.

Sentences:
${batch.map((s, i) => `${i + 1}. "${s.text}"`).join("\n")}

Respond with valid JSON array only.`;

  try {
    const response = await puter.ai.chat(prompt);
    const content = response.toString();
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (err) {
    console.error("AI Analysis failed:", err);
  }
  return null;
}

function analyzeSentenceLocal(sentence, index, context = {}) {
  const lower = sentence.text.toLowerCase();
  const words = lower.match(/[a-z]{3,}/g) || [];
  const unique = new Set(words);
  const genericMatches = genericPhrases.filter((phrase) => lower.includes(phrase));
  const fillerHits = words.filter((word) => academicFillers.includes(word)).length;
  const markerMatches = aiStyleMarkers.filter((marker) => lower.includes(marker));
  const vagueAdjectiveHits = words.filter((word) => vagueAdjectives.has(word)).length;
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
  const introConclusionPattern = /\b(due to|because of|in order to|with the help of|based on|according to|in the field of|in the area of)\b/i.test(sentence.text);
  const ungroundedSuperlative = /\b(most|best|major|critical|key|essential|important)\b/i.test(sentence.text) && specificSignals === 0;
  const citationMissingForClaim = (abstractClaim || broadOutcome || academicTemplate) && specificSignals === 0 && words.length > 12;
  const polishedButVague = vagueAdjectiveHits >= 2 && fillerHits >= 2;

  // New layer details
  const ngrams = getNGrams(sentence.text);
  const semanticFingerprint = getSemanticFingerprint(sentence.text);
  const structuralType = getStructuralType({ academicTemplate, passiveTemplate, abstractClaim, introConclusionPattern });

  // Calculate overlaps/frequencies from context
  const ngramOverlap = ngrams.filter((ng) => context.ngramFreqs && context.ngramFreqs[ng] > 1).length;
  const isSemanticDuplicate = context.semanticFreqs && context.semanticFreqs[semanticFingerprint] > 1;

  let structuralMonotony = false;
  if (context.structuralFlow && index >= 2) {
    const flow = context.structuralFlow.slice(index - 2, index + 1).join("-");
    if (context.flowFreqs[flow] > 1) structuralMonotony = true;
  }

  let score = context.academicDensity > 0.2 ? 26 : 18;
  score += Math.min(genericMatches.length * 22, 66);
  score += Math.min(markerMatches.length * 9, 36);
  score += Math.min(fillerHits * 4, 28);
  score += Math.min(vagueAdjectiveHits * 5, 24);
  score += words.length > 12 ? 8 : 0;
  score += words.length > 18 ? 9 : 0;
  score += words.length > 26 ? 10 : 0;
  score += words.length > 36 ? 8 : 0;
  score += lexicalRepetition > 0.22 ? 9 : 0;
  score += lexicalRepetition > 0.32 ? 8 : 0;
  score += stopwordRatio > 0.34 && words.length > 12 ? 9 : 0;
  score += academicTemplate ? 20 : 0;
  score += passiveTemplate ? 12 : 0;
  score += abstractClaim && broadOutcome ? 18 : 0;
  score += introConclusionPattern ? 8 : 0;
  score += ungroundedSuperlative ? 10 : 0;
  score += citationMissingForClaim ? 12 : 0;
  score += polishedButVague ? 12 : 0;
  score += context.transitionDensity > 0.14 ? 10 : 0;
  score += context.genericPhraseDensity > 0.08 ? 10 : 0;
  score += context.repeatedStemDensity > 0.08 ? 6 : 0;

  // New layer scoring
  score += Math.min(ngramOverlap * 15, 45);
  score += isSemanticDuplicate ? 25 : 0;
  score += structuralMonotony ? 15 : 0;

  score -= Math.min(specificSignals * 3, 10);
  score = Math.max(0, Math.min(100, Math.round(score)));

  const level = score >= 56 ? "HIGH" : score >= 24 ? "MEDIUM" : "LOW";
  const explanation = buildExplanation({
    genericMatches,
    markerMatches,
    fillerHits,
    vagueAdjectiveHits,
    academicTemplate,
    passiveTemplate,
    abstractClaim,
    broadOutcome,
    wordCount: words.length,
    specificSignals,
    citationMissingForClaim,
    polishedButVague,
    ngramOverlap,
    isSemanticDuplicate,
    structuralMonotony,
  });
  return { ...sentence, score, level, explanation };
}

function buildAnalysisContext(sentences) {
  const words = sentences.flatMap((sentence) => sentence.text.toLowerCase().match(/[a-z]{3,}/g) || []);
  const fillerHits = words.filter((word) => academicFillers.includes(word)).length;
  const stems = words.map((word) => word.replace(/(ation|ing|ment|ness|ity|ies|s)$/i, ""));
  const repeatedStemCount = [...new Set(stems)].filter((stem) => stem.length > 4 && stems.filter((item) => item === stem).length > 2).length;
  const markerHits = aiStyleMarkers.reduce((sum, marker) => {
    const pattern = new RegExp(`\\b${escapeRegExp(marker)}\\b`, "gi");
    return sum + sentences.reduce((count, sentence) => count + (sentence.text.match(pattern) || []).length, 0);
  }, 0);

  // Build layer frequency maps
  const ngramFreqs = {};
  const semanticFreqs = {};
  const structuralFlow = [];

  sentences.forEach((s) => {
    getNGrams(s.text).forEach((ng) => {
      ngramFreqs[ng] = (ngramFreqs[ng] || 0) + 1;
    });
    const finger = getSemanticFingerprint(s.text);
    if (finger.split(" ").length > 3) {
      semanticFreqs[finger] = (semanticFreqs[finger] || 0) + 1;
    }

    const details = {
      academicTemplate: /\b(this paper|this study|this research|the results|in conclusion|we propose|it is shown|it can be seen|the proposed|the system|the model|the method)\b/i.test(
        s.text,
      ),
      passiveTemplate: /\b(is|are|was|were|has been|have been|can be|could be|may be)\s+\w+ed\b/i.test(s.text),
      abstractClaim: /\b(improve|enhance|increase|reduce|optimize|support|provide|enable|ensure|achieve|address|contribute)\w*\b/i.test(s.text),
      introConclusionPattern: /\b(due to|because of|in order to|with the help of|based on|according to|in the field of|in the area of)\b/i.test(s.text),
    };
    structuralFlow.push(getStructuralType(details));
  });

  const flowFreqs = {};
  for (let i = 0; i <= structuralFlow.length - 3; i++) {
    const flow = structuralFlow.slice(i, i + 3).join("-");
    flowFreqs[flow] = (flowFreqs[flow] || 0) + 1;
  }

  return {
    academicDensity: words.length ? fillerHits / words.length : 0,
    transitionDensity: sentences.length ? markerHits / sentences.length : 0,
    repeatedStemDensity: words.length ? repeatedStemCount / words.length : 0,
    genericPhraseDensity: sentences.length
      ? genericPhrases.reduce((sum, phrase) => sum + sentences.filter((sentence) => sentence.text.toLowerCase().includes(phrase)).length, 0) / sentences.length
      : 0,
    ngramFreqs,
    semanticFreqs,
    structuralFlow,
    flowFreqs,
  };
}

function buildExplanation(details) {
  const {
    genericMatches,
    markerMatches,
    fillerHits,
    vagueAdjectiveHits,
    academicTemplate,
    passiveTemplate,
    abstractClaim,
    broadOutcome,
    wordCount,
    specificSignals,
    citationMissingForClaim,
    polishedButVague,
    ngramOverlap,
    isSemanticDuplicate,
    structuralMonotony,
  } = details;
  const parts = [];
  if (ngramOverlap >= 2) parts.push("Significant word-pattern overlap with other parts of this document.");
  if (isSemanticDuplicate) parts.push("Matches the semantic structure and concept map of another sentence.");
  if (structuralMonotony) parts.push("Follows a repetitive 3-sentence structural flow found elsewhere.");
  if (genericMatches.length) parts.push(`Matches common academic phrasing: ${genericMatches.slice(0, 2).join(", ")}.`);
  if (markerMatches.length) parts.push(`Uses AI-like transition or polish markers: ${markerMatches.slice(0, 2).join(", ")}.`);
  if (fillerHits >= 2) parts.push("Contains broad academic nouns with limited concrete detail.");
  if (vagueAdjectiveHits >= 2) parts.push("Uses vague evaluative adjectives that often appear in reused academic prose.");
  if (academicTemplate) parts.push("Uses a familiar paper-summary sentence pattern.");
  if (passiveTemplate) parts.push("Contains generic passive construction.");
  if (abstractClaim && broadOutcome) parts.push("Makes a broad improvement claim without much source-specific detail.");
  if (citationMissingForClaim) parts.push("Makes a broad scholarly claim without a citation, number, or concrete anchor.");
  if (polishedButVague) parts.push("Reads as polished but generic academic filler.");
  if (wordCount > 30) parts.push("Long sentence with broad scholarly wording.");
  if (specificSignals >= 2 && parts.length) parts.push("Specific citations, numbers, or acronyms reduce the final risk slightly.");
  return parts.length ? parts.join(" ") : "Lower risk: wording is compact or contains more specific details.";
}
