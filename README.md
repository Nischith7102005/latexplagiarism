# LaTeX Plagiarism Checker & Remover

A browser-only workflow app for checking and safely rewriting human-readable LaTeX text while preserving commands, math, environments, citations, labels, and references.

Open `index.html` in a browser to use the app.

## Workflow

The app is split into independent stages so each part can be scaled, updated, or debugged separately:

1. Validate LaTeX syntax warnings.
2. Protect LaTeX structure such as commands, math, citations, and environments.
3. Extract natural-language text and sentence positions.
4. Score plagiarism risk per sentence.
5. Render checker output or rewrite only selected flagged text.

## Code Structure

- `app.js` wires the UI to the workflow.
- `js/workflow.js` orchestrates each processing stage and emits progress updates.
- `js/latex.js` handles LaTeX validation, protected spans, text extraction, and sentence splitting.
- `js/analyzer.js` scores sentences and builds risk explanations.
- `js/rewriter.js` rewrites flagged text while preserving protected LaTeX.
- `js/utils.js` contains shared helpers.
- `js/sample.js` contains the default sample document.
