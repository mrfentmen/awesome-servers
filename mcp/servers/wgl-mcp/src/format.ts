import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  let moduleName = ""
  let signals = 0
  let vectors = 0
  let patterns = 0
  let timeplates = 0

  for (const [index, raw] of text.split(/\r?\n/).entries()) {
    const line = raw.trim()
    if (!line || line.startsWith("//")) continue
    const lineNo = index + 1
    const moduleMatch = /^module\s+([A-Za-z_]\w*)/.exec(line)
    if (moduleMatch) {
      moduleName = moduleMatch[1]
      records.push({ id: "module", kind: "module", fields: { name: moduleName, line: lineNo } })
      continue
    }
    const signalMatch = /^signal\s+(.+)$/.exec(line)
    if (signalMatch) {
      const names = signalMatch[1].replace(/;$/, "").split(",").map((name) => name.trim()).filter(Boolean)
      signals += names.length
      records.push({ id: `signal:${lineNo}`, kind: "signal", fields: { names: names.join(","), line: lineNo } })
      continue
    }
    if (/^vector\s*\(/.test(line)) {
      vectors += 1
      records.push({ id: `vector:${vectors}`, kind: "vector", fields: { line: lineNo } })
      continue
    }
    if (/^pattern\b/.test(line)) {
      patterns += 1
      records.push({ id: `pattern:${patterns}`, kind: "pattern", fields: { line: lineNo } })
      continue
    }
    if (/^timeplate\b/.test(line)) {
      timeplates += 1
      records.push({ id: `timeplate:${timeplates}`, kind: "timeplate", fields: { line: lineNo } })
    }
  }

  const opens = (text.match(/\{/g) ?? []).length
  const closes = (text.match(/\}/g) ?? []).length
  if (opens !== closes) issues.push({ code: "unbalanced", severity: "error", message: `${opens} '{' but ${closes} '}'` })
  if (!moduleName) issues.push({ code: "no-module", severity: "error", message: "File has no module declaration" })
  if (vectors === 0) issues.push({ code: "no-vectors", severity: "error", message: "File has no vector" })
  if (patterns === 0) issues.push({ code: "no-patterns", severity: "warning", message: "File has no pattern" })
  if (signals === 0) issues.push({ code: "no-signals", severity: "warning", message: "File has no signal" })

  return {
    format: "WGL",
    records,
    meta: { module: moduleName, signals, vectors, patterns, timeplates },
    issues,
  }
}

const reference = [
  "Advantest WGL vector file",
  "",
  "module top;",
  "signal clk, data;",
  "timeplate tp = period 10;",
  "vector (clk data) { 0 0; 1 1; }",
  "pattern p1 = vector;",
  "",
  "module opens the file.",
  "signals are declared once, then used by vectors.",
  "Braces must balance.",
].join("\n")

export const format: FormatModule = {
  slug: "wgl",
  displayName: "WGL",
  extensions: [".wgl"],
  description: "Parse WGL vectors, validate modules, signals and braces.",
  reference,
  parse,
  sample: () =>
    [
      "module top;",
      "signal clk, data;",
      "timeplate tp = period 10;",
      "vector (clk data) { 0 0; 1 1; }",
      "pattern p1 = vector;",
    ].join("\n") + "\n",
}
