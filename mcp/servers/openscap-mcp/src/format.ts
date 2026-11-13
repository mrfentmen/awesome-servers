import type { FormatModule, Parsed, ParsedRecord } from "./types.js"
import { readRoot, validateXml } from "./_xml.js"

const XCCDF_RESULTS = new Set(["pass", "fail", "error", "unknown", "notapplicable", "fixed"])
const OVAL_RESULTS = new Set(["true", "false", "error", "unknown", "not evaluated", "not_applicable"])
const textOf = (block: string, tag: string): string => {
  const match = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, "i").exec(block)
  return match ? match[1].replace(/<[^>]+>/g, "").trim() : ""
}

function parse(source: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const root = readRoot(source)
  validateXml(source, root, "SCAP results", issues)

  let kind = ""
  let passed = 0
  let failed = 0
  if (root === "Benchmark") {
    kind = "xccdf"
    const tests = [...source.matchAll(/<TestResult\b([^>]*)>([\s\S]*?)<\/TestResult>/gi)]
    if (tests.length === 0) issues.push({ code: "no-test-result", severity: "error", message: "Benchmark has no TestResult" })
    for (const test of tests) {
      const children = [...test[2].matchAll(/<rule-result\b([^>]*)>([\s\S]*?)<\/rule-result>/gi)]
      if (children.length === 0) issues.push({ code: "no-rule-results", severity: "error", message: "TestResult has no rule-result" })
      for (const child of children) {
        const attrs = child[1]
        const idref = /\bidref="([^"]+)"/.exec(attrs)?.[1] ?? ""
        const severity = /\bseverity="([^"]+)"/.exec(attrs)?.[1] ?? ""
        const result = textOf(child[2], "result").toLowerCase()
        if (!idref) issues.push({ code: "no-idref", severity: "error", message: "rule-result has no idref" })
        if (!XCCDF_RESULTS.has(result)) issues.push({ code: "bad-result", severity: "error", message: `rule-result ${idref || "?"} has invalid result: ${result || "missing"}` })
        if (result === "pass") passed += 1
        if (result === "fail") failed += 1
        records.push({ id: `rule-result:${idref || records.length + 1}`, kind: "rule-result", fields: { idref, severity, result } })
      }
    }
    const scoreText = textOf(source, "score")
    const score = scoreText ? Number(scoreText) : NaN
    if (scoreText && (!Number.isFinite(score) || score < 0 || score > 100)) issues.push({ code: "bad-score", severity: "warning", message: `Score outside 0-100: ${scoreText}` })
    return { format: "OpenSCAP", records, meta: { kind, results: records.length, pass: passed, fail: failed, score: Number.isFinite(score) ? score : 0 }, issues }
  }

  if (root === "oval_results") {
    kind = "oval"
    const definitions = [...source.matchAll(/<definition\b([^>]*)>([\s\S]*?)<\/definition>/gi)]
    if (definitions.length === 0) issues.push({ code: "no-definitions", severity: "error", message: "oval_results has no definition" })
    for (const definition of definitions) {
      const attrs = definition[1]
      const id = /\bid="([^"]+)"/.exec(attrs)?.[1] ?? ""
      const version = Number(/\bversion="([^"]+)"/.exec(attrs)?.[1] ?? 0)
      const result = textOf(definition[2], "result").toLowerCase()
      if (!id.startsWith("oval:")) issues.push({ code: "bad-definition-id", severity: "error", message: `Definition id must start with oval:: ${id || "missing"}` })
      if (!Number.isInteger(version) || version < 1) issues.push({ code: "bad-version", severity: "error", message: `Definition ${id || "?"} has invalid version` })
      if (!OVAL_RESULTS.has(result)) issues.push({ code: "bad-result", severity: "error", message: `Definition ${id || "?"} has invalid result: ${result || "missing"}` })
      if (result === "true") passed += 1
      if (result === "false") failed += 1
      records.push({ id: `definition:${id || records.length + 1}`, kind: "definition", fields: { definitionId: id, version, result } })
    }
    return { format: "OpenSCAP", records, meta: { kind, results: records.length, pass: passed, fail: failed }, issues }
  }

  if (root) issues.push({ code: "bad-root", severity: "error", message: `Root must be Benchmark or oval_results, found ${root}` })
  return { format: "OpenSCAP", records, meta: { kind: root || "unknown", results: 0 }, issues }
}

const reference = [
  "OpenSCAP / SCAP results",
  "",
  "<Benchmark>",
  "  <TestResult>",
  '    <rule-result idref="xccdf_demo_rule" severity="high">',
  "      <result>pass</result>",
  "    </rule-result>",
  "    <score>95.5</score>",
  "  </TestResult>",
  "</Benchmark>",
  "",
  "XCCDF results use pass, fail, error, unknown, notapplicable or fixed.",
  "OVAL results use true, false, error, unknown, not evaluated or not_applicable.",
  "OVAL definition ids start with oval:.",
].join("\n")

export const format: FormatModule = {
  slug: "openscap",
  displayName: "OpenSCAP",
  extensions: [".xml", ".scap"],
  description: "Parse XCCDF and OVAL results, validate rule results, scores and ids.",
  reference,
  parse,
  sample: () =>
    [
      '<?xml version="1.0"?>',
      '<Benchmark xmlns="http://checklists.nist.gov/xccdf/1.2">',
      '  <TestResult id="xccdf_demo_testresult" start-time="2026-11-13T00:00:00">',
      '    <rule-result idref="xccdf_demo_rule" severity="high">',
      "      <result>pass</result>",
      "    </rule-result>",
      "    <score>95.5</score>",
      "  </TestResult>",
      "</Benchmark>",
    ].join("\n") + "\n",
}
