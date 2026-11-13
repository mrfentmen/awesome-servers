import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

function splitFields(line: string): string[] {
  return line.includes(",") ? line.split(",").map((value) => value.trim()) : line.split(/\s+/).filter(Boolean)
}

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const nodes = new Set<number>()
  const keywords = new Set<string>()
  let current = ""
  let sawKeyword = false
  let elementCount = 0

  text.split(/\r?\n/).forEach((raw, index) => {
    const number = index + 1
    const line = raw.trim()
    if (line.length === 0 || line.startsWith("$")) return

    if (line.startsWith("*")) {
      sawKeyword = true
      current = line.slice(1).split(/[\s,]/)[0].toUpperCase()
      keywords.add(current)
      records.push({ id: `kw:${current}:${number}`, kind: "keyword", fields: { name: current, line: number } })
      return
    }

    if (current === "NODE") {
      const fields = splitFields(line)
      if (fields.length < 4) {
        issues.push({ code: "short-node", severity: "error", message: `Node needs id and x y z: ${line.slice(0, 40)}`, line: number })
        return
      }
      const id = Number(fields[0])
      const [x, y, z] = [Number(fields[1]), Number(fields[2]), Number(fields[3])]
      if (!Number.isInteger(id) || id <= 0) {
        issues.push({ code: "bad-node-id", severity: "error", message: `Node id must be a positive integer: ${fields[0]}`, line: number })
        return
      }
      if (![x, y, z].every(Number.isFinite)) {
        issues.push({ code: "bad-coordinate", severity: "error", message: `Node ${id} has a non numeric coordinate`, line: number })
      }
      if (nodes.has(id)) {
        issues.push({ code: "duplicate-node", severity: "error", message: `Node ${id} is defined twice`, line: number })
      }
      nodes.add(id)
      records.push({ id: `node:${id}`, kind: "node", fields: { id, x: Number.isFinite(x) ? x : 0, y: Number.isFinite(y) ? y : 0, z: Number.isFinite(z) ? z : 0 } })
      return
    }

    if (current.startsWith("ELEMENT")) {
      const fields = splitFields(line).map(Number)
      const [eid, pid, ...refs] = fields
      if (!Number.isInteger(eid) || refs.length === 0) {
        issues.push({ code: "bad-element", severity: "error", message: `Element needs an id, part id and nodes: ${line.slice(0, 40)}`, line: number })
        return
      }
      elementCount += 1
      records.push({
        id: `element:${eid}`,
        kind: "element",
        fields: { id: eid, part: pid, type: current, nodes: refs.length, connectivity: refs.join(",") },
      })
      return
    }

    if (current === "PART" || current === "TITLE" || current === "HEADING") {
      records.push({ id: `text:${number}`, kind: "text", fields: { keyword: current, value: line } })
    }
  })

  for (const record of records) {
    if (record.kind !== "element") continue
    const refs = String(record.fields.connectivity ?? "").split(",").filter(Boolean).map(Number)
    for (const ref of refs) {
      if (!nodes.has(ref)) {
        issues.push({ code: "missing-node", severity: "error", message: `Element ${record.fields.id} references node ${ref}, which is not defined` })
        break
      }
    }
  }

  if (!sawKeyword) {
    issues.push({ code: "no-keyword", severity: "error", message: "File has no *KEYWORD cards", line: 1 })
  } else if (!/^\s*\*KEYWORD/im.test(text)) {
    issues.push({ code: "missing-start", severity: "warning", message: "File does not start with *KEYWORD", line: 1 })
  }

  return {
    format: "LS-DYNA",
    records,
    meta: {
      keywords: keywords.size,
      nodes: nodes.size,
      elements: elementCount,
      nodeCards: records.filter((record) => record.kind === "node").length,
    },
    issues,
  }
}

const reference = [
  "LS-DYNA keyword file",
  "",
  "*KEYWORD",
  "*NODE",
  "1,0.0,0.0,0.0",
  "*ELEMENT_SHELL",
  "1,1,1,2,3,4",
  "*PART",
  "",
  "Every card starts with * and a keyword name in column one.",
  "Lines beginning with $ are comments.",
  "Fields are comma separated, or free format separated by spaces.",
  "Node rows are id, x, y, z.",
  "Element rows are element id, part id, then node ids.",
].join("\n")

export const format: FormatModule = {
  slug: "ls-dyna",
  displayName: "LS-DYNA",
  extensions: [".k", ".key", ".dyn"],
  description: "Parse LS-DYNA keyword files, validate nodes, elements and connectivity.",
  reference,
  parse,
  sample: () =>
    [
      "*KEYWORD",
      "*NODE",
      "1,0.0,0.0,0.0",
      "2,1.0,0.0,0.0",
      "3,1.0,1.0,0.0",
      "4,0.0,1.0,0.0",
      "*ELEMENT_SHELL",
      "1,1,1,2,3,4",
      "*PART",
      "Demo part",
    ].join("\n") + "\n",
}
