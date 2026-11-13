import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

const FUNCTIONS = new Set([
  "count",
  "avg",
  "sum",
  "min",
  "max",
  "rate",
  "quantile",
  "by",
  "select",
  "coalesce",
  "histogram",
  "compare",
  "most_recent",
  "first",
  "last",
  "abs",
  "sqrt",
  "ceil",
  "floor",
  "round",
])

const INTRINSICS = new Set([
  "duration",
  "status",
  "kind",
  "name",
  "parent",
  "rootServiceName",
  "rootSpanName",
  "traceDuration",
  "spanDuration",
])

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const source = text.trim()

  if (!source) issues.push({ code: "empty", severity: "error", message: "Query is empty" })
  const opens = (source.match(/\{/g) ?? []).length
  const closes = (source.match(/\}/g) ?? []).length
  if (opens !== closes) issues.push({ code: "unbalanced", severity: "error", message: `Unbalanced braces: ${opens} open, ${closes} close` })

  let spansets = 0
  let conditions = 0
  const fields = new Set<string>()

  for (const block of source.matchAll(/\{([^{}]*)\}/g)) {
    const body = block[1].trim()
    if (!body) {
      issues.push({ code: "empty-spanset", severity: "error", message: "Spanset has no conditions" })
      continue
    }
    spansets += 1
    for (const part of body.split(/\s*(?:&&|\|\|)\s*/)) {
      if (!part) continue
      const match = /^(\.?[A-Za-z_][\w.]*)\s*(=~|!~|!=|>=|<=|=|>|<)\s*(.+)$/.exec(part.trim())
      if (!match) {
        issues.push({ code: "bad-condition", severity: "error", message: `Cannot parse condition: ${part.trim()}` })
        continue
      }
      const field = match[1]
      const operator = match[2]
      const value = match[3].trim()
      if (field.startsWith(".") && field.length < 2) {
        issues.push({ code: "bad-field", severity: "error", message: `Invalid attribute ${field}` })
      } else if (!field.startsWith(".") && !INTRINSICS.has(field)) {
        issues.push({ code: "bad-intrinsic", severity: "error", message: `Unknown intrinsic ${field}` })
      }
      if (!value) issues.push({ code: "no-value", severity: "error", message: `Condition on ${field} has no value` })
      if (/^["']/.test(value) && value[0] !== value[value.length - 1]) {
        issues.push({ code: "unterminated", severity: "error", message: `Unterminated string after ${field}` })
      }
      fields.add(field)
      conditions += 1
      records.push({ id: `condition:${conditions}`, kind: "condition", fields: { field, operator, value } })
    }
  }

  const tail = source.slice(source.lastIndexOf("}") + 1).trim()
  let stages = 0
  if (tail) {
    if (!tail.startsWith("|")) {
      issues.push({ code: "bad-tail", severity: "error", message: "Expected a pipeline after the spanset" })
    } else {
      for (const raw of tail.split("|").map((stage) => stage.trim()).filter(Boolean)) {
        const match = /^([a-z_][a-z0-9_]*)\s*\(([^)]*)\)\s*(?:(>=|<=|!=|=|>|<)\s*(.+))?$/.exec(raw)
        if (!match) {
          issues.push({ code: "bad-stage", severity: "error", message: `Cannot parse pipeline stage: ${raw}` })
          continue
        }
        const name = match[1]
        const args = match[2].trim()
        if (!FUNCTIONS.has(name)) issues.push({ code: "unknown-stage", severity: "error", message: `Unknown pipeline function ${name}()` })
        if (name === "by" && !args.startsWith(".")) issues.push({ code: "bad-by", severity: "error", message: "by() needs an attribute such as .service.name" })
        if (match[4] !== undefined && !match[4].trim()) issues.push({ code: "no-compare", severity: "error", message: `Comparison after ${name}() has no value` })
        stages += 1
        records.push({ id: `stage:${stages}`, kind: "stage", fields: { function: name, args, operator: match[3] ?? "", value: match[4]?.trim() ?? "" } })
      }
    }
  }

  if (spansets === 0) issues.push({ code: "no-spanset", severity: "error", message: "Query has no spanset" })
  if (conditions === 0) issues.push({ code: "no-conditions", severity: "error", message: "Query has no conditions" })

  return {
    format: "TraceQL",
    records,
    meta: { spansets, conditions, stages, fields: fields.size },
    issues,
  }
}

const reference = [
  "TraceQL query",
  "",
  '{ .service.name = "checkout" && .http.status_code >= 500 } | count() > 2',
  "",
  "A spanset is written in braces and holds attribute comparisons.",
  "Attributes start with a dot; intrinsics include duration, status, kind and name.",
  "Operators: = != > >= < <= =~ !~.",
  "Pipeline stages follow a | and use functions such as count(), avg() or by().",
].join("\n")

export const format: FormatModule = {
  slug: "traceql",
  displayName: "TraceQL",
  extensions: [".traceql", ".tq"],
  description: "Parse TraceQL queries, validate spansets, attributes and pipeline stages.",
  reference,
  parse,
  sample: () => '{ .service.name = "checkout" && .http.status_code >= 500 } | count() > 2\n',
}
