import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

function stripComments(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "")
}

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const source = stripComments(text)
  const functions = new Set<string>()

  let depth = 0
  for (const char of source) {
    if (char === "{") depth += 1
    if (char === "}") depth -= 1
    if (depth < 0) {
      issues.push({ code: "unmatched-brace", severity: "error", message: "Closing brace without an opening brace" })
      depth = 0
      break
    }
  }
  if (depth > 0) issues.push({ code: "unclosed-brace", severity: "error", message: `${depth} brace(s) left unclosed` })

  const parens = (source.match(/\(/g) ?? []).length - (source.match(/\)/g) ?? []).length
  if (parens !== 0) issues.push({ code: "unbalanced-parens", severity: "error", message: `Parentheses are unbalanced by ${parens}` })

  for (const match of source.matchAll(/["']([^"'\n]*)["']/g)) {
    void match
  }
  const quotes = (source.match(/"/g) ?? []).length
  if (quotes % 2 !== 0) {
    issues.push({ code: "unclosed-string", severity: "error", message: "An odd number of double quotes means an unclosed string" })
  }

  for (const match of source.matchAll(/^(?:function\s+)?([A-Za-z_]\w*)\s*\(([^)]*)\)\s*\{/gm)) {
    const name = match[1]
    if (functions.has(name)) {
      issues.push({ code: "duplicate-function", severity: "error", message: `Function ${name} is declared twice` })
    }
    functions.add(name)
    records.push({ id: `function:${name}`, kind: "function", fields: { name, params: match[2].trim() } })
  }

  for (const match of source.matchAll(/^\s*(?:if|else if)\s*\(([^)]*)\)/gm)) {
    records.push({ id: `if:${records.length + 1}`, kind: "condition", fields: { test: match[1].trim().slice(0, 120) } })
  }
  for (const match of source.matchAll(/for\s+each\s+(\w+)\s+in\s+([\w.()]+)/gi)) {
    records.push({ id: `loop:${records.length + 1}`, kind: "loop", fields: { variable: match[1], collection: match[2] } })
  }
  for (const match of source.matchAll(/([A-Z][A-Za-z0-9_]*)\.([A-Za-z_]\w*)\s*\(/g)) {
    records.push({ id: `call:${records.length + 1}`, kind: "call", fields: { object: match[1], method: match[2] } })
  }

  if (functions.size === 0 && records.length === 0) {
    issues.push({ code: "empty-plugin", severity: "warning", message: "Plugin has no functions or statements" })
  }

  return {
    format: "Sibelius ManuScript",
    records,
    meta: {
      functions: functions.size,
      conditions: records.filter((record) => record.kind === "condition").length,
      loops: records.filter((record) => record.kind === "loop").length,
      calls: records.filter((record) => record.kind === "call").length,
    },
    issues,
  }
}

const reference = [
  "Sibelius ManuScript plugin (.plg)",
  "",
  "// Demo plugin",
  "Plugins.Add('Demo', 'Demo plugin');",
  "",
  "OnClick() {",
  "    Sel.All();",
  "    MessageBox('Hello');",
  "}",
  "",
  "Blocks use braces. Strings use single or double quotes.",
  "// to end of line and /* ... */ are comments.",
  "Handlers such as OnClick are functions with a body.",
  "",
  "The binary .sib score format is not text; this server reads ManuScript plugins.",
].join("\n")

export const format: FormatModule = {
  slug: "sibelius",
  displayName: "Sibelius ManuScript",
  extensions: [".plg"],
  description: "Parse Sibelius ManuScript plugins, validate blocks, functions and calls.",
  reference,
  parse,
  regressions: [{ doc: "OnClick() {\n  MessageBox('x');\n", expectError: "left unclosed" }],
  sample: () =>
    [
      "// Demo plugin",
      "Plugins.Add('Demo', 'Demo plugin');",
      "",
      "OnClick() {",
      "    Sel.All();",
      "    MessageBox('Hello');",
      "}",
    ].join("\n") + "\n",
}
