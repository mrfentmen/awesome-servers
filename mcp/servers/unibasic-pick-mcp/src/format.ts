import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

const STATEMENTS = new Set(["CRT", "PRINT", "IF", "THEN", "ELSE", "END", "RETURN", "CALL", "GOSUB", "GOTO", "LOOP", "WHILE", "UNTIL", "NEXT", "REPEAT", "FOR", "OPEN", "CLOSE", "READ", "WRITE", "DELETE", "MAT", "DIM", "EQUATE", "INCLUDE", "CHAIN", "EXECUTE", "LOCATE", "CONVERT", "SUBROUTINE", "PROGRAM", "FUNCTION"])

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  let header = ""
  let sawReturn = false
  let labelLine = 0

  text.split(/\r?\n/).forEach((raw, index) => {
    const number = index + 1
    const line = raw.trim()
    if (line.length === 0 || line.startsWith("*") || line.startsWith("!") || line.startsWith("REM")) return

    const head = /^(SUBROUTINE|PROGRAM|FUNCTION)\s+([A-Za-z_][\w.]*)/i.exec(line)
    if (head) {
      if (header) {
        issues.push({ code: "duplicate-header", severity: "error", message: `Second ${head[1].toUpperCase()} header: ${head[2]}`, line: number })
      }
      header = head[2]
      labelLine = number
      records.push({ id: `header:${header}`, kind: "header", fields: { kind: head[1].toUpperCase(), name: header, line: number } })
      return
    }

    if (/^(RETURN|END)\b/i.test(line)) {
      sawReturn = true
      records.push({ id: `end:${number}`, kind: "end", fields: { line: number } })
      return
    }

    const statement = line.split(/[\s(;]/)[0].toUpperCase()
    if (!STATEMENTS.has(statement) && !line.includes("=") && !line.includes(":")) {
      issues.push({ code: "unknown-statement", severity: "warning", message: `Unknown UniBasic statement: ${statement}`, line: number })
    }
    records.push({ id: `stmt:${number}`, kind: "statement", fields: { statement, text: line.slice(0, 120), line: number } })
  })

  if (!header) {
    issues.push({ code: "no-header", severity: "error", message: "File has no SUBROUTINE, PROGRAM or FUNCTION header" })
  }
  if (!sawReturn) {
    issues.push({ code: "no-return", severity: "error", message: "File has no RETURN or END", line: labelLine })
  }

  return {
    format: "UniBasic",
    records,
    meta: {
      program: header,
      statements: records.filter((record) => record.kind === "statement").length,
      hasReturn: sawReturn,
    },
    issues,
  }
}

const reference = [
  "UniBasic / Pick BASIC source",
  "",
  "SUBROUTINE DEMO(A, B)",
  "* comment",
  "  CRT A",
  "  RETURN",
  "",
  "The file starts with SUBROUTINE, PROGRAM or FUNCTION and a name.",
  "* or ! starts a comment.",
  "The file ends with RETURN or END.",
].join("\n")

export const format: FormatModule = {
  slug: "unibasic-pick",
  displayName: "UniBasic",
  extensions: [".ubas", ".unibasic"],
  description: "Parse UniBasic source, validate headers and RETURN.",
  reference,
  parse,
  sample: () =>
    [
      "SUBROUTINE DEMO(A, B)",
      "* comment",
      "  CRT A",
      "  RETURN",
    ].join("\n") + "\n",
}
