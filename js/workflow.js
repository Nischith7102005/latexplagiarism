import { scoreSentences } from "./analyzer.js";
import { buildLatexMask, extractTextRuns, splitSentences, validateLatex } from "./latex.js";
import { rewriteLatex } from "./rewriter.js";
import { delayFrame } from "./utils.js";

export const WORKFLOW_STEPS = ["validate", "protect", "extract", "score", "output"];

export async function runWorkflow(text, mode, options, hooks = {}) {
  const notify = async (step, status, detail = "") => {
    hooks.onStep?.(step, status, detail);
    await delayFrame();
  };

  WORKFLOW_STEPS.forEach((step) => hooks.onStep?.(step, "waiting", "Waiting"));

  await notify("validate", "running", "Checking syntax");
  const warnings = validateLatex(text);
  await notify("validate", warnings.length ? "warning" : "done", warnings.length ? `${warnings.length} warning(s)` : "Valid enough");

  await notify("protect", "running", "Protecting commands");
  const mask = buildLatexMask(text);
  const protectedChars = mask.filter(Boolean).length;
  await notify("protect", "done", `${protectedChars} protected`);

  await notify("extract", "running", "Finding readable text");
  const runs = extractTextRuns(text, mask);
  const rawSentences = splitSentences(runs);
  await notify("extract", rawSentences.length ? "done" : "warning", `${rawSentences.length} sentence(s)`);

  await notify("score", "running", "Scoring risk");
  const scored = await scoreSentences(rawSentences, (msg) => {
    notify("score", "running", msg);
  });
  const analysis = { warnings, mask, protectedChars, ...scored };
  await notify("score", "done", `${analysis.flagged.length} flagged`);

  await notify("output", "running", mode === "checker" ? "Rendering highlights" : "Rewriting flagged text");
  const rewrite = mode === "remover" ? await rewriteLatex(text, analysis, options) : null;
  await notify("output", "done", rewrite ? `${rewrite.changes} changed` : `${analysis.overall}% score`);

  return { analysis, rewrite };
}
