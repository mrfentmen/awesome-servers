import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const variables: string[] = []
  let inData = false
  let dataLine = 0
  let sawEnd = false

  text.split(/\r?\n/).forEach((raw, index) => {
    const number = index + 1
    const line = raw.trim()
    if (line.length === 0 || line.startsWith("*")) return
    const upper = line.toUpperCase()

    if (upper === "DEFINE DATA LOCAL" || upper === "DEFINE DATA") {
      if (inData) {
        issues.push({ code: "nested-data", severity: "error", message: "DEFINE DATA opened while a data block is already open", line: number })
      }
      inData = true
      dataLine = number
      records.push({ id: `data:${number}`, kind: "block", fields: { name: "DEFINE DATA", scope: upper.endsWith("LOCAL") ? "local" : "global" } })
      return
    }

    if (upper === "END-DEFINE") {
      if (!inData) {
        issues.push({ code: "stray-end-define", severity: "error", message: "END-DEFINE without DEFINE DATA", line: number })
      }
      inData = false
      return
    }

    if (upper === "END") {
      sawEnd = true
      records.push({ id: `end:${number}`, kind: "end", fields: { line: number } })
      return
    }

    if (inData) {
      const variable = /^(\d)\s+([#A-Za-z][\w-]*)\s*(?:\(([A-Z]\d+(?:\.\d+)?)\))?/.exec(line)
      if (!variable) {
        issues.push({ code: "bad-variable", severity: "error", message: `Data line must be level, name and format: ${line.slice(0, 40)}`, line: number })
        return
      }
      const name = variable[2]
      const format = variable[3] ?? ""
      if (!format) {
        issues.push({ code: "missing-format", severity: "warning", message: `Variable ${name} has no format`, line: number })
      }
      if (variables.includes(name)) {
        issues.push({ code: "duplicate-variable", severity: "error", message: `Variable ${name} is declared twice`, line: number })
      }
      variables.push(name)
      records.push({ id: `variable:${name}`, kind: "variable", fields: { level: Number(variable[1]), name, format } })
      return
    }

    const statement = line.split(/\s+/)[0].toUpperCase()
    records.push({ id: `stmt:${number}`, kind: "statement", fields: { statement, text: line.slice(0, 120), line: number } })
  })

  if (inData) {
    issues.push({ code: "unclosed-data", severity: "error", message: "DEFINE DATA has no END-DEFINE", line: dataLine })
  }
  if (!sawEnd) {
    issues.push({ code: "no-end", severity: "error", message: "Program has no END statement" })
  }

  return {
    format: "Adabas Natural",
    records,
    meta: {
      variables: variables.length,
      statements: records.filter((record) => record.kind === "statement").length,
      hasData: records.some((record) => record.kind === "block"),
    },
    issues,
  }
}

const reference = [
  "Adabas Natural program",
  "",
  "DEFINE DATA LOCAL",
  "1 #NAME (A20)",
  "1 #COUNT (N5)",
  "END-DEFINE",
  "MOVE 'X' TO #NAME",
  "WRITE #NAME",
  "END",
  "",
  "Data blocks start with DEFINE DATA and end with END-DEFINE.",
  "Variables are level, name and an optional format such as (A20).",
  "* starts a comment.",
  "The program ends with END.",
].join("\n")

export const format: FormatModule = {
  slug: "adabas-natural",
  displayName: "Adabas Natural",
  extensions: [".nsp", ".nsa", ".nss"],
  description: "Parse Adabas Natural programs, validate data blocks and variables.",
  reference,
  parse,
  sample: () =>
    [
      "DEFINE DATA LOCAL",
      "1 #NAME (A20)",
      "1 #COUNT (N5)",
      "END-DEFINE",
      "MOVE 'X' TO #NAME",
      "WRITE #NAME",
      "END",
    ].join("\n") + "\n",
}
