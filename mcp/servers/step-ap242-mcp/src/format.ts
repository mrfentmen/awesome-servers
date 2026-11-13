import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

const START = "ISO-10303-21;"
const END = "END-ISO-10303-21;"

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const lines = text.split(/\r?\n/)
  const ids = new Map<string, number>()
  const references: Array<{ from: string; to: string; line: number }> = []
  let inData = false
  let sawHeader = false
  let sawData = false

  if (!text.trimStart().startsWith(START)) {
    issues.push({ code: "missing-start", severity: "error", message: `File must start with ${START}`, line: 1 })
  }
  if (!text.includes(END)) {
    issues.push({ code: "missing-end", severity: "error", message: `File must end with ${END}` })
  }

  lines.forEach((raw, index) => {
    const number = index + 1
    const line = raw.trim()
    if (line.length === 0) return

    if (line === "HEADER;") {
      sawHeader = true
      return
    }
    if (line === "DATA;") {
      sawData = true
      inData = true
      return
    }
    if (line === "ENDSEC;") {
      inData = false
      return
    }

    const entity = /^#(\d+)\s*=\s*([A-Z0-9_]+)\s*\(([\s\S]*)\)\s*;$/.exec(line)
    if (entity) {
      const id = entity[1]
      const type = entity[2]
      if (ids.has(id)) {
        issues.push({ code: "duplicate-id", severity: "error", message: `Entity #${id} is defined twice`, line: number })
      }
      ids.set(id, number)
      const refs = [...entity[3].matchAll(/#(\d+)/g)].map((match) => match[1])
      for (const ref of refs) references.push({ from: id, to: ref, line: number })
      records.push({
        id: `#${id}`,
        kind: type,
        fields: { id: Number(id), type, references: refs.length, refs: refs.join(","), line: number },
      })
      return
    }

    if (inData && line.startsWith("#")) {
      issues.push({ code: "malformed-entity", severity: "error", message: `Entity line is not well formed: ${line.slice(0, 60)}`, line: number })
    }
  })

  if (!sawHeader) issues.push({ code: "missing-header", severity: "error", message: "HEADER; section is missing" })
  if (!sawData) issues.push({ code: "missing-data", severity: "error", message: "DATA; section is missing" })

  for (const reference of references) {
    if (!ids.has(reference.to)) {
      issues.push({
        code: "dangling-reference",
        severity: "error",
        message: `Entity #${reference.from} references #${reference.to} which is not defined`,
        line: reference.line,
      })
    }
  }

  const types = new Set(records.map((record) => record.kind))
  return {
    format: "STEP AP242",
    records,
    meta: {
      entities: records.length,
      types: types.size,
      references: references.length,
      dataSection: sawData,
    },
    issues,
  }
}

const reference = [
  "STEP / ISO 10303-21 physical file",
  "",
  "ISO-10303-21;",
  "HEADER;",
  "FILE_DESCRIPTION((''),'2;1');",
  "FILE_SCHEMA(('IFC4'));",
  "ENDSEC;",
  "DATA;",
  "#1=IFCPROJECT('GlobalId',$,'Name',$,$,$,$,$,$);",
  "ENDSEC;",
  "END-ISO-10303-21;",
  "",
  "Every instance is #id=TYPE(args); and must end with a semicolon.",
  "References between instances are written #id.",
  "A reference to a missing id is an error.",
].join("\n")

export const format: FormatModule = {
  slug: "step-ap242",
  displayName: "STEP AP242",
  extensions: [".stp", ".step", ".p21"],
  description: "Parse STEP physical files, index entities and catch dangling references.",
  reference,
  parse,
  sample: () =>
    [
      "ISO-10303-21;",
      "HEADER;",
      "FILE_DESCRIPTION((''),'2;1');",
      "FILE_NAME('demo.stp','2026-01-01',(''),(''),'','','');",
      "FILE_SCHEMA(('AP242'));",
      "ENDSEC;",
      "DATA;",
      "#1=IFCPROJECT('abc',$,'Demo',$,$,$,$,$,$);",
      "#2=IFCWALL('def',$,'Wall',$,#1,$,$);",
      "ENDSEC;",
      "END-ISO-10303-21;",
    ].join("\n") + "\n",
}
