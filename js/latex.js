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

function maskAllArgs(text, mask, index) {
  let cursor = skipSpaces(text, index);
  while (cursor < text.length && (text[cursor] === "[" || text[cursor] === "{")) {
    if (text[cursor] === "[") {
      const end = findBalanced(text, cursor, "[", "]");
      protectRange(mask, cursor, end === -1 ? text.length : end + 1);
      cursor = skipSpaces(text, end === -1 ? text.length : end + 1);
    } else {
      const end = findClosingBrace(text, cursor);
      protectRange(mask, cursor, end === -1 ? text.length : end + 1);
      cursor = skipSpaces(text, end === -1 ? text.length : end + 1);
    }
  }
  return cursor;
}

export function validateLatex(text) {
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

export function buildLatexMask(text) {
  const mask = Array(text.length).fill(false);
  const boundaries = Array(text.length).fill(false);

  const BLOCK_COMMANDS = new Set([
    "section",
    "subsection",
    "subsubsection",
    "paragraph",
    "subparagraph",
    "chapter",
    "part",
    "caption",
    "footnote",
    "thanks",
    "title",
    "author",
    "date",
    "item",
  ]);

  const INLINE_TEXT_COMMANDS = new Set([
    "textbf",
    "textit",
    "emph",
    "text",
    "textsc",
    "textsl",
    "textsf",
    "textmd",
    "textup",
  ]);

  const mathEnvironments = new Set(["equation", "align", "align*", "gather", "gather*", "multline", "multline*"]);
  const codeEnvironments = new Set([
    "verbatim",
    "verbatim*",
    "lstlisting",
    "minted",
    "Verbatim",
    "BVerbatim",
    "LVerbatim",
    "alltt",
    "filecontents",
    "filecontents*",
    "algorithmic",
    "algorithmicx",
  ]);
  const structuralEnvironments = new Set([
    "tabular",
    "tabular*",
    "array",
    "tikzpicture",
    "picture",
    "pgfpicture",
  ]);

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

      if (command === "verb" || command === "lstinline") {
        const end = findDelimitedCommandEnd(text, commandEnd);
        protectRange(mask, i, end);
        i = Math.max(i, end - 1);
        continue;
      }

      if (command === "mintinline") {
        const afterLanguage = protectRequiredArgs(text, mask, protectOptionalArgs(text, mask, commandEnd));
        const end = findDelimitedCommandEnd(text, afterLanguage);
        protectRange(mask, i, end);
        i = Math.max(i, end - 1);
        continue;
      }

      if (command === "begin") {
        const braceStart = skipSpaces(text, commandEnd);
        if (text[braceStart] === "{") {
          const braceEnd = findClosingBrace(text, braceStart);
          const envName = braceEnd > braceStart ? text.slice(braceStart + 1, braceEnd) : "";
          if (mathEnvironments.has(envName) || codeEnvironments.has(envName) || structuralEnvironments.has(envName)) {
            const closeTag = `\\end{${envName}}`;
            const envEnd = text.indexOf(closeTag, braceEnd + 1);
            protectRange(mask, i, envEnd === -1 ? text.length : envEnd + closeTag.length);
            i = envEnd === -1 ? text.length : envEnd + closeTag.length - 1;
            continue;
          }
        }
      }

      const baseCommand = command.replace(/\*$/, "");
      if (BLOCK_COMMANDS.has(baseCommand)) {
        boundaries[i] = true;
        const cursor = protectOptionalArgs(text, mask, commandEnd);
        // Also find the end of the required arguments to set a boundary
        let endCursor = cursor;
        while (text[endCursor] === "{") {
          const end = findClosingBrace(text, endCursor);
          if (end !== -1) {
            endCursor = skipSpaces(text, end + 1);
          } else {
            endCursor = text.length;
          }
        }
        if (endCursor < text.length) boundaries[endCursor] = true;
        i = Math.max(i, cursor - 1);
      } else if (INLINE_TEXT_COMMANDS.has(baseCommand)) {
        const cursor = protectOptionalArgs(text, mask, commandEnd);
        i = Math.max(i, cursor - 1);
      } else {
        const cursor = maskAllArgs(text, mask, commandEnd);
        i = Math.max(i, cursor - 1);
      }
    }
  }

  for (let i = 0; i < text.length; i += 1) {
    if ("{}[]&%#_^~".includes(text[i])) mask[i] = true;
  }

  return { mask, boundaries };
}

function findDelimitedCommandEnd(text, commandEnd) {
  let cursor = skipSpaces(text, commandEnd);
  if (cursor >= text.length) return text.length;

  const delimiter = text[cursor];
  if (delimiter === "{") {
    const end = findClosingBrace(text, cursor);
    return end === -1 ? text.length : end + 1;
  }

  const end = findUnescaped(text, delimiter, cursor + 1);
  return end === -1 ? text.length : end + 1;
}

export function extractTextRuns(text, mask, boundaries = []) {
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
    const char = text[i];
    const previousChar = text[i - 1] || "";
    const nextChar = text[i + 1] || "";
    const blankLine = char === "\n" && previousChar === "\n";
    const isBoundary = boundaries[i] === true;

    if (blankLine || isBoundary) flush();

    if (mask[i]) {
      pendingProtectedSpace = true;
      continue;
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

export function splitSentences(runs) {
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

      sentences.push({ text: sentenceText, start, end: end + 1 });
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

function countByName(values) {
  return values.reduce((counts, value) => {
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {});
}
