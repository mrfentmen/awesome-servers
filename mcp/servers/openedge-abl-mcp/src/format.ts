import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

function stripComments(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, "")
}

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const source = stripComments(text)
  const variables = new Set<string>()
  const tables = new Set<string>()
  let openers = 0
  let closers = 0

  source.split(/\r?\n/).forEach((raw, index) => {
    const number = index + 1
    const line = raw.replace(/\/\/.*$/, "").replace(/^\s*\*.*$/, "").trim()
    if (line.length === 0) return

    const variable = /^DEFINE\s+(?:NEW\s+)?(?:SHARED\s+)?(?:GLOBAL\s+)?VARIABLE\s+([\w-]+)(?:\s+AS\s+([\w.-]+))?/i.exec(line)
    if (variable) {
      const name = variable[1]
      if (!variable[2]) {
        issues.push({ code: "variable-without-type", severity: "error", message: `DEFINE VARIABLE ${name} has no AS type`, line: number })
      }
      if (variables.has(name)) {
        issues.push({ code: "duplicate-variable", severity: "error", message: `Variable ${name} is defined twice`, line: number })
      }
      variables.add(name)
      records.push({ id: `variable:${name}`, kind: "variable", fields: { name, type: variable[2] ?? "", line: number } })
      return
    }

    const procedure = /^(?:PROCEDURE|FUNCTION|METHOD)\s+([\w-]+)\s*:/i.exec(line)
    if (procedure) {
      openers += 1
      records.push({ id: `procedure:${procedure[1]}`, kind: "procedure", fields: { name: procedure[1], line: number } })
      return
    }

    if (/^END\s+PROCEDURE\.?\s*$/i.test(line) || /^END\s+FUNCTION\.?\s*$/i.test(line) || /^END\s+METHOD\.?\s*$/i.test(line)) {
      closers += 1
      return
    }

    if (/^END\.?\s*$/i.test(line)) {
      closers += 1
      return
    }

    const block = /^(FOR\s+EACH|FOR\s+FIRST|REPEAT|DO|CASE)\b/i.exec(line)
    if (block) {
      openers += 1
      records.push({ id: `block:${number}`, kind: "block", fields: { kind: block[1].toUpperCase(), line: number } })
      return
    }

    const table = /^(?:FOR\s+EACH|FOR\s+FIRST)\s+([\w.]+)/i.exec(line)
    if (table) {
      tables.add(table[1])
    }

    if (!line.endsWith(".") && !line.endsWith(":") && !line.endsWith("{")) {
      issues.push({ code: "missing-period", severity: "warning", message: `Statement does not end with a period: ${line.slice(0, 40)}`, line: number })
    }
    records.push({ id: `stmt:${number}`, kind: "statement", fields: { text: line.slice(0, 120), line: number } })
  })

  if (openers !== closers) {
    issues.push({ code: "unbalanced-blocks", severity: "error", message: `${openers} block opener(s) but ${closers} END statement(s)` })
  }

  return {
    format: "OpenEdge ABL",
    records,
    meta: {
      variables: variables.size,
      procedures: records.filter((record) => record.kind === "procedure").length,
      blocks: records.filter((record) => record.kind === "block").length,
      statements: records.filter((record) => record.kind === "statement").length,
    },
    issues,
  }
}

const reference = [
  "OpenEdge ABL source",
  "",
  "DEFINE VARIABLE cName AS CHARACTER NO-UNDO.",
  "",
  "PROCEDURE LoadData:",
  "    FOR EACH Customer NO-LOCK:",
  "        DISPLAY Customer.Name.",
  "    END.",
  "END PROCEDURE.",
  "",
  "Statements end with a period.",
  "PROCEDURE, FUNCTION, FOR EACH and DO open a block closed by END.",
  "/* */ and // are comments.",
].join("\n")

export const format: FormatModule = {
  slug: "openedge-abl",
  displayName: "OpenEdge ABL",
  extensions: [".p", ".cls", ".i"],
  description: "Parse OpenEdge ABL source, validate variables, blocks and periods.",
  reference,
  parse,
  sample: () =>
    [
      "DEFINE VARIABLE cName AS CHARACTER NO-UNDO.",
      "",
      "PROCEDURE LoadData:",
      "    FOR EACH Customer NO-LOCK:",
      "        DISPLAY Customer.Name.",
      "    END.",
      "END PROCEDURE.",
    ].join("\n") + "\n",
}
