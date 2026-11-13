import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

const STATEMENTS = new Set(["PROGRAM", "SUBROUTINE", "FUNCTION", "END", "RETURN", "IF", "THEN", "ELSE", "LOOP", "WHILE", "REPEAT", "UNTIL", "NEXT", "CALL", "GOSUB", "CRT", "PRINT", "OPEN", "CLOSE", "READ", "WRITE", "LOCATE", "MAT", "EQUATE", "DIMENSION", "COMMON", "INCLUDE", "DEBUG"])

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const inserts: string[] = []
  let program = ""
  let headerLine = 0
  let sawEnd = false

  text.split(/\r?\n/).forEach((raw, index) => {
    const number = index + 1
    const line = raw.trim()
    if (line.length === 0 || line.startsWith("*")) return

    if (line.startsWith("$")) {
      const directive = /^\$([A-Za-z]+)\s*(.*)$/.exec(line)
      if (!directive) {
        issues.push({ code: "bad-directive", severity: "error", message: `Bad compiler directive: ${line.slice(0, 30)}`, line: number })
        return
      }
      const kind = directive[1].toUpperCase()
      const value = directive[2].trim()
      if (kind === "INSERT") {
        if (!value) issues.push({ code: "empty-insert", severity: "error", message: "$INSERT needs a record name", line: number })
        inserts.push(value)
      }
      records.push({ id: `directive:${kind}:${number}`, kind: "directive", fields: { kind, value, line: number } })
      return
    }

    const label = /^([A-Za-z_]\w*):\s*$/.exec(line)
    if (label) {
      records.push({ id: `label:${label[1]}`, kind: "label", fields: { name: label[1], line: number } })
      return
    }

    const head = /^(PROGRAM|SUBROUTINE)\s+([A-Za-z_][\w.]*)/i.exec(line)
    if (head) {
      if (program) {
        issues.push({ code: "duplicate-header", severity: "error", message: `Second ${head[1].toUpperCase()} header: ${head[2]}`, line: number })
      }
      program = head[2]
      headerLine = number
      records.push({ id: `program:${program}`, kind: "program", fields: { kind: head[1].toUpperCase(), name: program, line: number } })
      return
    }

    if (/^END\s*$/i.test(line)) {
      sawEnd = true
      records.push({ id: `end:${number}`, kind: "end", fields: { line: number } })
      return
    }

    const statement = line.split(/[\s(]/)[0].toUpperCase()
    if (!STATEMENTS.has(statement) && !line.includes("=") && !line.includes(":")) {
      issues.push({ code: "unknown-statement", severity: "warning", message: `Unknown jBC statement: ${statement}`, line: number })
    }
    records.push({ id: `stmt:${number}`, kind: "statement", fields: { statement, text: line.slice(0, 120), line: number } })
  })

  if (!program) {
    issues.push({ code: "no-header", severity: "error", message: "Source has no PROGRAM or SUBROUTINE header" })
  }
  if (!sawEnd) {
    issues.push({ code: "no-end", severity: "error", message: "Source has no final END", line: headerLine })
  }

  return {
    format: "Temenos T24",
    records,
    meta: {
      program,
      statements: records.filter((record) => record.kind === "statement").length,
      inserts: inserts.length,
      labels: records.filter((record) => record.kind === "label").length,
    },
    issues,
  }
}

const reference = [
  "Temenos T24 jBC source",
  "",
  "PROGRAM DEMO",
  "$INSERT I_COMMON",
  "* comment",
  "CRT \"HELLO\"",
  "END",
  "",
  "The first statement is PROGRAM or SUBROUTINE and the name.",
  "$INSERT pulls in a record or include.",
  "* starts a comment.",
  "The source ends with END.",
].join("\n")

export const format: FormatModule = {
  slug: "temenos-t24",
  displayName: "Temenos T24",
  extensions: [".b", ".jbc"],
  description: "Parse Temenos T24 jBC source, validate headers, inserts and END.",
  reference,
  parse,
  regressions: [{ doc: "CRT \"HELLO\"\n", expectError: "no PROGRAM or SUBROUTINE" }],
  sample: () =>
    [
      "PROGRAM DEMO",
      "$INSERT I_COMMON",
      "CRT \"HELLO\"",
      "END",
    ].join("\n") + "\n",
}
