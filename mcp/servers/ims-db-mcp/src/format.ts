import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

const STATEMENTS = new Set(["DBD", "DATASET", "SEGM", "FIELD", "LCHILD", "INDEX", "PSB", "PCB", "SENSEG", "SENFLD", "DBDGEN", "PSBGEN", "FINISH", "END"])

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const segments = new Map<string, number>()
  const parents: Array<{ name: string; parent: string; line: number }> = []
  let kind = ""
  let hasFinish = false

  text.split(/\r?\n/).forEach((raw, index) => {
    const number = index + 1
    if (raw.trim().startsWith("*")) return
    const line = raw.trim()
    if (line.length === 0) return

    const tokens = line.split(/\s+/)
    const statement = tokens[0].toUpperCase()
    if (!STATEMENTS.has(statement)) {
      issues.push({ code: "unknown-statement", severity: "warning", message: `Unknown IMS control statement: ${tokens[0]}`, line: number })
      return
    }

    const operands: Record<string, string> = {}
    for (const part of tokens.slice(1).join(" ").split(",")) {
      const equals = part.indexOf("=")
      if (equals > 0) operands[part.slice(0, equals).trim().toUpperCase()] = part.slice(equals + 1).trim()
    }

    if (statement === "DBD") kind = "DBD"
    if (statement === "PSB") kind = "PSB"
    if (statement === "FINISH") hasFinish = true

    if (statement === "SEGM") {
      const name = operands.NAME
      if (!name) {
        issues.push({ code: "segment-without-name", severity: "error", message: "SEGM needs a NAME operand", line: number })
        return
      }
      if (segments.has(name)) {
        issues.push({ code: "duplicate-segment", severity: "error", message: `Segment ${name} is defined twice`, line: number })
      }
      segments.set(name, number)
      parents.push({ name, parent: operands.PARENT ?? "", line: number })
    }

    records.push({ id: `${statement}:${operands.NAME ?? number}`, kind: statement.toLowerCase(), fields: { ...operands, line: number } })
  })

  for (const segment of parents) {
    if (segment.parent === "" || segment.parent === "0") continue
    if (!segments.has(segment.parent)) {
      issues.push({ code: "unknown-parent", severity: "error", message: `Segment ${segment.name} has PARENT=${segment.parent}, which is not defined`, line: segment.line })
    }
  }
  if (kind === "") {
    issues.push({ code: "no-definition", severity: "error", message: "Source has neither a DBD nor a PSB statement" })
  }
  if (!hasFinish) {
    issues.push({ code: "no-finish", severity: "error", message: "Source has no FINISH statement" })
  }

  return {
    format: "IMS",
    records,
    meta: {
      kind,
      segments: segments.size,
      fields: records.filter((record) => record.kind === "field").length,
      statements: records.length,
    },
    issues,
  }
}

const reference = [
  "IMS DBD / PSB source",
  "",
  "         DBD   NAME=DEMODBD,ACCESS=HDAM",
  "         SEGM  NAME=ROOT,PARENT=0,BYTES=20",
  "         FIELD NAME=KEY,BYTES=8,START=1",
  "         SEGM  NAME=CHILD,PARENT=ROOT,BYTES=16",
  "         DBDGEN",
  "         FINISH",
  "         END",
  "",
  "Statements start with a control word: DBD, PSB, SEGM, FIELD, DATASET, PCB.",
  "Operands are NAME=VALUE pairs separated by commas.",
  "* in column one starts a comment.",
  "SEGM PARENT must be 0 or another defined segment.",
].join("\n")

export const format: FormatModule = {
  slug: "ims-db",
  displayName: "IMS",
  extensions: [".dbd", ".psb"],
  description: "Parse IMS DBD and PSB source, validate segments and parents.",
  reference,
  parse,
  sample: () =>
    [
      "         DBD   NAME=DEMODBD,ACCESS=HDAM",
      "         DATASET NAME=DEMODBD",
      "         SEGM  NAME=ROOT,PARENT=0,BYTES=20",
      "         FIELD NAME=KEY,BYTES=8,START=1",
      "         SEGM  NAME=CHILD,PARENT=ROOT,BYTES=16",
      "         DBDGEN",
      "         FINISH",
      "         END",
    ].join("\n") + "\n",
}
