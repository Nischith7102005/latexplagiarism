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

Code-oriented content is skipped during extraction, including common environments such as `verbatim`, `lstlisting`, `minted`, `alltt`, and inline code commands such as `\verb`, `\lstinline`, `\mintinline`, and `\texttt`.

The checker intentionally runs in a strict mode. It flags generic academic phrasing, AI-like transition density, vague scholarly nouns, broad unsupported claims, passive templates, long polished sentences, and repeated document-level wording. Concrete technical text with numbers, datasets, citations, and specific measurements is scored lower.

The remover rewrites only unprotected natural-language spans. If a risky sentence contains `\cite`, `\ref`, math, or other protected LaTeX, the surrounding prose can be rewritten while the protected LaTeX is preserved in place.

## Code Structure

- `app.js` wires the UI to the workflow.
- `js/workflow.js` orchestrates each processing stage and emits progress updates.
- `js/latex.js` handles LaTeX validation, protected spans, text extraction, and sentence splitting.
- `js/analyzer.js` scores sentences and builds risk explanations.
- `js/rewriter.js` rewrites flagged text while preserving protected LaTeX.
- `js/utils.js` contains shared helpers.
- `js/sample.js` contains the default sample document.
