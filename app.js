import { sampleLatex } from "./js/sample.js";
import { runWorkflow } from "./js/workflow.js";
import { escapeHtml } from "./js/utils.js";

const elements = {
  input: document.querySelector("#latexInput"),
  checkerTab: document.querySelector("#checkerTab"),
  removerTab: document.querySelector("#removerTab"),
  runButton: document.querySelector("#runButton"),
  copyOutput: document.querySelector("#copyOutput"),
  loadSample: document.querySelector("#loadSample"),
  highlightedOutput: document.querySelector("#highlightedOutput"),
  riskList: document.querySelector("#riskList"),
  scoreStrip: document.querySelector("#scoreStrip"),
  scoreValue: document.querySelector("#scoreValue"),
  flaggedCount: document.querySelector("#flaggedCount"),
  protectedCount: document.querySelector("#protectedCount"),
  latexStatus: document.querySelector("#latexStatus"),
  warningBox: document.querySelector("#warningBox"),
  checkerView: document.querySelector("#checkerView"),
  removerView: document.querySelector("#removerView"),
  originalOutput: document.querySelector("#originalOutput"),
  rewrittenOutput: document.querySelector("#rewrittenOutput"),
  outputTitle: document.querySelector("#outputTitle"),
  outputSubtitle: document.querySelector("#outputSubtitle"),
  rewriteControls: document.querySelector("#rewriteControls"),
  rewriteDepth: document.querySelector("#rewriteDepth"),
  includeMedium: document.querySelector("#includeMedium"),
  workflowSummary: document.querySelector("#workflowSummary"),
  workflowSteps: document.querySelector("#workflowSteps"),
};

const state = {
  mode: "checker",
  lastOutput: "",
  latestRunId: 0,
};

function setMode(mode) {
  state.mode = mode;
  const checker = mode === "checker";
  elements.checkerTab.classList.toggle("active", checker);
  elements.removerTab.classList.toggle("active", !checker);
  elements.checkerTab.setAttribute("aria-selected", String(checker));
  elements.removerTab.setAttribute("aria-selected", String(!checker));
  elements.checkerView.hidden = !checker;
  elements.removerView.hidden = checker;
  elements.rewriteControls.hidden = checker;
  elements.scoreStrip.hidden = !checker;
  elements.outputTitle.textContent = checker ? "Checker Results" : "Remover Results";
  elements.outputSubtitle.textContent = checker
    ? "Highlighted LaTeX preview and risk score."
    : "Full LaTeX output with only flagged sentences rewritten.";
  resetWorkflow();
}

function resetWorkflow() {
  elements.workflowSummary.textContent = "Ready to process";
  for (const item of elements.workflowSteps.querySelectorAll("li")) {
    item.className = "";
    item.querySelector("small").textContent = "Waiting";
  }
}

function updateWorkflowStep(step, status, detail) {
  const item = elements.workflowSteps.querySelector(`[data-step="${step}"]`);
  if (!item) return;
  item.className = status;
  item.querySelector("small").textContent = detail || status;
  elements.workflowSummary.textContent = detail || status;
}

function renderWarnings(warnings) {
  if (!warnings.length) {
    elements.warningBox.hidden = true;
    elements.warningBox.textContent = "";
    return;
  }
  elements.warningBox.hidden = false;
  elements.warningBox.textContent = `Warning: ${warnings.join(" ")}`;
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
  elements.highlightedOutput.innerHTML = pieces.join("");
}

function renderRiskList(sentences) {
  const flagged = sentences.filter((item) => item.level !== "LOW");
  if (!flagged.length) {
    elements.riskList.innerHTML = `<div class="risk-item risk-low"><strong><span class="label low">LOW</span> No plagiarism detected</strong><p>The original LaTeX can be used as-is.</p></div>`;
    return;
  }

  elements.riskList.innerHTML = flagged
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

function clearOutput() {
  elements.highlightedOutput.textContent = "";
  elements.rewrittenOutput.textContent = "";
  elements.originalOutput.textContent = "";
  elements.riskList.innerHTML = "";
  state.lastOutput = "";
  elements.scoreValue.textContent = "0%";
  elements.flaggedCount.textContent = "0";
  elements.protectedCount.textContent = "0";
  elements.latexStatus.textContent = "Ready";
  resetWorkflow();
}

async function run() {
  const text = elements.input.value.trimEnd();
  if (!text.trim()) {
    clearOutput();
    return;
  }

  const runId = (state.latestRunId += 1);
  elements.runButton.disabled = true;
  elements.latexStatus.textContent = "Processing";

  try {
    const result = await runWorkflow(
      text,
      state.mode,
      {
        depth: elements.rewriteDepth.value,
        includeMedium: elements.includeMedium.checked,
      },
      {
        onStep: (step, status, detail) => {
          if (runId === state.latestRunId) updateWorkflowStep(step, status, detail);
        },
      },
    );

    if (runId !== state.latestRunId) return;

    const { analysis, rewrite } = result;
    renderWarnings(analysis.warnings);
    elements.protectedCount.textContent = String(analysis.protectedChars);

    if (state.mode === "checker") {
      renderHighlights(text, analysis.sentences);
      renderRiskList(analysis.sentences);
      elements.scoreValue.textContent = `${analysis.overall}%`;
      elements.flaggedCount.textContent = String(analysis.flagged.length);
      elements.latexStatus.textContent = `Scanned ${analysis.sentences.length} sentences`;
      elements.workflowSummary.textContent = `Complete: ${analysis.flagged.length} flagged`;
      state.lastOutput = text;
      return;
    }

    elements.originalOutput.textContent = text;
    elements.rewrittenOutput.textContent = rewrite.output;
    state.lastOutput = rewrite.output;
    elements.latexStatus.textContent = rewrite.changes ? `${rewrite.changes} changed` : "No changes";
    elements.workflowSummary.textContent = `Complete: ${rewrite.changes} changed`;
  } catch (error) {
    elements.latexStatus.textContent = "Workflow error";
    elements.workflowSummary.textContent = "Stopped by an error";
    elements.warningBox.hidden = false;
    elements.warningBox.textContent = `Error: ${error.message}`;
  } finally {
    elements.runButton.disabled = false;
  }
}

elements.checkerTab.addEventListener("click", () => setMode("checker"));
elements.removerTab.addEventListener("click", () => setMode("remover"));
elements.runButton.addEventListener("click", run);
elements.loadSample.addEventListener("click", () => {
  elements.input.value = sampleLatex;
  run();
});

elements.copyOutput.addEventListener("click", async () => {
  const output = state.mode === "checker" ? elements.input.value : state.lastOutput;
  if (!output) return;
  await navigator.clipboard.writeText(output);
  const original = elements.copyOutput.textContent;
  elements.copyOutput.textContent = "Copied";
  setTimeout(() => {
    elements.copyOutput.textContent = original;
  }, 1100);
});

elements.input.value = sampleLatex;
setMode("checker");
run();
