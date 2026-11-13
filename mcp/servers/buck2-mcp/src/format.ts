import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

function splitTopLevel(body: string): string[] {
  const out: string[] = []
  let depth = 0
  let current = ""
  let inString = false
  for (const char of body) {
    if (char === '"' && !inString) inString = true
    else if (char === '"') inString = false
    if (!inString) {
      if (char === "(" || char === "[" || char === "{") depth += 1
      if (char === ")" || char === "]" || char === "}") depth -= 1
      if (char === "," && depth === 0) {
        out.push(current)
        current = ""
        continue
      }
    }
    current += char
  }
  if (current.trim().length > 0) out.push(current)
  return out
}

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const names = new Map<string, number>()
  const source = text.replace(/#[^\n]*/g, "")

  let depth = 0
  let buffer = ""
  let startLine = 0
  const calls: Array<{ body: string; line: number }> = []

  source.split(/\r?\n/).forEach((raw, index) => {
    const number = index + 1
    if (buffer.length === 0) startLine = number
    for (const char of raw) {
      if (char === "(" || char === "[" || char === "{") depth += 1
      if (char === ")" || char === "]" || char === "}") depth -= 1
    }
    buffer = buffer.length > 0 ? `${buffer}\n${raw}` : raw
    if (depth <= 0) {
      if (buffer.trim().length > 0) calls.push({ body: buffer.trim(), line: startLine })
      buffer = ""
      depth = 0
    }
    if (depth < 0) {
      issues.push({ code: "unmatched-bracket", severity: "error", message: "Closing bracket without an opening bracket", line: number })
      depth = 0
    }
  })
  if (buffer.trim().length > 0) {
    issues.push({ code: "unclosed-call", severity: "error", message: "Call is never closed", line: startLine })
    calls.push({ body: buffer.trim(), line: startLine })
  }

  for (const call of calls) {
    const load = /^load\(\s*"([^"]+)"\s*,?\s*([\s\S]*)\)$/.exec(call.body)
    if (load) {
      const symbols = [...load[2].matchAll(/"([^"]+)"/g)].map((match) => match[1])
      if (symbols.length === 0) {
        issues.push({ code: "load-without-symbols", severity: "warning", message: `load(${load[1]}) imports nothing`, line: call.line })
      }
      records.push({ id: `load:${call.line}`, kind: "load", fields: { module: load[1], symbols: symbols.join(",") } })
      continue
    }

    const rule = /^([a-z_][\w]*)\s*\(([\s\S]*)\)$/i.exec(call.body)
    if (!rule) {
      if (call.body.startsWith("load(")) continue
      issues.push({ code: "unknown-call", severity: "warning", message: `Not a rule call: ${call.body.slice(0, 50)}`, line: call.line })
      continue
    }

    const args = splitTopLevel(rule[2])
    const fields: Record<string, string> = {}
    for (const arg of args) {
      const pair = /^\s*([A-Za-z_]\w*)\s*=\s*([\s\S]+)$/.exec(arg)
      if (!pair) continue
      fields[pair[1]] = pair[2].replace(/^["']|["']$/g, "").trim()
    }
    const name = fields.name ?? ""
    if (!name) {
      issues.push({ code: "rule-without-name", severity: "error", message: `${rule[1]}() has no name argument`, line: call.line })
      continue
    }
    if (names.has(name)) {
      issues.push({ code: "duplicate-target", severity: "error", message: `Target ${name} is declared twice`, line: call.line })
    }
    names.set(name, call.line)
    records.push({
      id: name,
      kind: rule[1],
      fields: {
        name,
        srcs: (fields.srcs ?? "").replace(/[\[\]]/g, "").trim(),
        deps: (fields.deps ?? "").replace(/[\[\]]/g, "").trim(),
        line: call.line,
      },
    })
  }

  if (records.filter((record) => record.kind !== "load").length === 0) {
    issues.push({ code: "no-rules", severity: "error", message: "File declares no build rules" })
  }

  return {
    format: "Buck2",
    records,
    meta: {
      loads: records.filter((record) => record.kind === "load").length,
      targets: records.filter((record) => record.kind !== "load").length,
      types: new Set(records.filter((record) => record.kind !== "load").map((record) => record.kind)).size,
    },
    issues,
  }
}

const reference = [
  "Buck2 BUCK file (Starlark)",
  "",
  "load(\"//tools:defs.bzl\", \"cpp_binary\")",
  "cpp_binary(",
  "    name = \"app\",",
  "    srcs = [\"main.cpp\"],",
  "    deps = [\":lib\"],",
  ")",
  "",
  "Every rule call needs a unique name.",
  "Comments start with #.",
  "Calls may span several lines; brackets must balance.",
].join("\n")

export const format: FormatModule = {
  slug: "buck2",
  displayName: "Buck2",
  extensions: [".buck", "BUCK"],
  description: "Parse Buck2 BUCK files, validate targets, loads and names.",
  reference,
  parse,
  sample: () =>
    [
      'load("//tools:defs.bzl", "cpp_binary")',
      "",
      "cpp_binary(",
      '    name = "app",',
      '    srcs = ["main.cpp"],',
      '    deps = [":lib"],',
      ")",
    ].join("\n") + "\n",
}
