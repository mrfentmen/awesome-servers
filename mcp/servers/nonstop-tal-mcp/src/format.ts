import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

const DECLARATIONS = new Set(["INT", "INT32", "STRING", "REAL", "FIXED", "STRUCT", "LITERAL", "PROC", "PROCEDURE", "SUBPROC", "ENTRY", "DEFINE", "CONSTANT"])

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  let procedures = 0
  let ends = 0
  let name = ""

  text.split(/\r?\n/).forEach((raw, index) => {
    const number = index + 1
    const line = raw.replace(/--.*$/, "").trim()
    if (line.length === 0 || line.startsWith("!")) return

    const head = /^(PROC|PROCEDURE|SUBPROC)\s+([A-Za-z_][\w$]*)/i.exec(line)
    if (head) {
      procedures += 1
      name = head[2]
      records.push({ id: `proc:${name}`, kind: "procedure", fields: { kind: head[1].toUpperCase(), name, line: number } })
      return
    }

    if (/^END\s*;?\s*$/i.test(line)) {
      ends += 1
      return
    }

    if (/^BEGIN\s*;?\s*$/i.test(line)) {
      records.push({ id: `begin:${number}`, kind: "block", fields: { line: number } })
      return
    }

    const declaration = /^([A-Za-z_]+)\s+([A-Za-z_][\w$]*)/.exec(line)
    if (declaration && DECLARATIONS.has(declaration[1].toUpperCase())) {
      records.push({ id: `decl:${declaration[2]}`, kind: "declaration", fields: { type: declaration[1], name: declaration[2], line: number } })
      return
    }

    if (!line.endsWith(";")) {
      issues.push({ code: "missing-semicolon", severity: "warning", message: `Statement does not end with ;: ${line.slice(0, 40)}`, line: number })
    }
    records.push({ id: `stmt:${number}`, kind: "statement", fields: { text: line.slice(0, 120), line: number } })
  })

  if (procedures === 0) {
    issues.push({ code: "no-procedure", severity: "error", message: "Source has no PROC or PROCEDURE" })
  }
  if (procedures !== ends) {
    issues.push({ code: "unbalanced-procedures", severity: "error", message: `${procedures} procedure(s) but ${ends} END statement(s)` })
  }

  return {
    format: "NonStop TAL",
    records,
    meta: {
      procedures,
      declarations: records.filter((record) => record.kind === "declaration").length,
      statements: records.filter((record) => record.kind === "statement").length,
    },
    issues,
  }
}

const reference = [
  "NonStop TAL source",
  "",
  "PROC demo (x);",
  "BEGIN",
  "  INT x;",
  "  x := x + 1;",
  "END;",
  "",
  "PROC or PROCEDURE opens a routine and END; closes it.",
  "Declarations start with a type such as INT or STRING.",
  "Statements end with a semicolon.",
  "-- and ! start comments.",
].join("\n")

export const format: FormatModule = {
  slug: "nonstop-tal",
  displayName: "NonStop TAL",
  extensions: [".tal"],
  description: "Parse NonStop TAL source, validate procedures, declarations and semicolons.",
  reference,
  parse,
  sample: () =>
    [
      "PROC demo (x);",
      "BEGIN",
      "  INT x;",
      "  x := x + 1;",
      "END;",
    ].join("\n") + "\n",
}
