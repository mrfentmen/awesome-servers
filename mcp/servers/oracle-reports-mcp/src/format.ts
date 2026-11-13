import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

const KINDS = new Set(["REPORT", "QUERY", "GROUP", "FIELD", "PARAMETER", "FORMULA", "SUMMARY", "DATA", "LAYOUT", "PLACEHOLDER"])

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const names = new Map<string, string>()
  let report = ""

  text.split(/\r?\n/).forEach((raw, index) => {
    const number = index + 1
    const line = raw.replace(/--.*$/, "").trim()
    if (line.length === 0) return

    const define = /^DEFINE\s+([A-Za-z_]\w*)\s+([A-Za-z_]\w*)(?:\s+(.*))?$/i.exec(line)
    if (!define) {
      issues.push({ code: "bad-line", severity: "warning", message: `Not a DEFINE statement: ${line.slice(0, 48)}`, line: number })
      return
    }

    const kind = define[1].toUpperCase()
    const name = define[2]
    const rest = (define[3] ?? "").trim()
    if (!KINDS.has(kind)) {
      issues.push({ code: "unknown-kind", severity: "warning", message: `Unknown DEFINE kind: ${kind}`, line: number })
    }
    if (kind === "REPORT") report = name
    const key = `${kind}:${name}`
    if (names.has(key)) {
      issues.push({ code: "duplicate-definition", severity: "error", message: `${kind} ${name} is defined twice`, line: number })
    }
    names.set(key, kind)
    if (kind === "FIELD" && /\bDATATYPE\b/i.test(rest) === false && rest.length > 0) {
      issues.push({ code: "field-without-datatype", severity: "warning", message: `FIELD ${name} has no DATATYPE`, line: number })
    }
    records.push({ id: key, kind: kind.toLowerCase(), fields: { name, rest: rest.slice(0, 120), line: number } })
  })

  if (report === "") {
    issues.push({ code: "no-report", severity: "error", message: "Definition has no DEFINE REPORT" })
  }

  return {
    format: "Oracle Reports",
    records,
    meta: {
      report,
      queries: records.filter((record) => record.kind === "query").length,
      groups: records.filter((record) => record.kind === "group").length,
      fields: records.filter((record) => record.kind === "field").length,
      definitions: records.length,
    },
    issues,
  }
}

const reference = [
  "Oracle Reports REX definition",
  "",
  "DEFINE REPORT demo",
  "DEFINE QUERY q1",
  "DEFINE GROUP g1",
  "DEFINE FIELD f1 DATATYPE NUMBER",
  "DEFINE FIELD f2 DATATYPE CHARACTER",
  "",
  "Each definition starts with DEFINE, then the kind and the name.",
  "Kinds: REPORT, QUERY, GROUP, FIELD, PARAMETER, FORMULA, SUMMARY.",
  "-- starts a comment.",
  "A definition needs exactly one DEFINE REPORT.",
].join("\n")

export const format: FormatModule = {
  slug: "oracle-reports",
  displayName: "Oracle Reports",
  extensions: [".rex"],
  description: "Parse Oracle Reports REX definitions, validate queries, groups and fields.",
  reference,
  parse,
  sample: () =>
    [
      "DEFINE REPORT demo",
      "DEFINE QUERY q1",
      "DEFINE GROUP g1",
      "DEFINE FIELD f1 DATATYPE NUMBER",
      "DEFINE FIELD f2 DATATYPE CHARACTER",
    ].join("\n") + "\n",
}
