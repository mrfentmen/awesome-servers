import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

const ELEMENTS = new Set(["CTRIA3", "CQUAD4", "CTETRA", "CHEXA", "CPENTA", "CBAR", "CBEAM", "CROD", "CONM2", "RBE2", "RBE3"])
const PROPERTIES = new Set(["PSHELL", "PSOLID", "PBAR", "PBEAM", "PROD", "PCOMP", "MAT1", "MAT2", "MAT8"])

function fields(line: string): string[] {
  if (line.includes(",")) {
    const out = line.split(",").map((value) => value.trim())
    while (out.length > 0 && out[out.length - 1] === "") out.pop()
    return out
  }
  const out: string[] = []
  for (let index = 0; index < line.length; index += 8) {
    const chunk = line.slice(index, index + 8).trim()
    if (chunk.length === 0) break
    if (chunk.startsWith("*")) break
    out.push(chunk)
  }
  return out
}

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const grids = new Map<number, number>()
  let sawEnd = false
  let cardCount = 0

  text.split(/\r?\n/).forEach((raw, index) => {
    const number = index + 1
    const line = raw.trim()
    if (line.length === 0) return
    if (line.startsWith("$") || line.startsWith("BEGIN")) return
    if (line === "ENDDATA") {
      sawEnd = true
      return
    }

    const parts = fields(line)
    const card = (parts[0] ?? "").toUpperCase()
    if (!/^[A-Z][A-Z0-9]{2,7}$/.test(card)) {
      issues.push({ code: "bad-card", severity: "error", message: `Line does not start with a Nastran card name: ${line.slice(0, 40)}`, line: number })
      return
    }
    cardCount += 1

    if (card === "GRID") {
      const id = Number(parts[1])
      const [x, y, z] = [Number(parts[3]), Number(parts[4]), Number(parts[5])]
      if (!Number.isInteger(id) || id <= 0) {
        issues.push({ code: "bad-grid-id", severity: "error", message: `GRID id must be a positive integer: ${parts[1]}`, line: number })
        return
      }
      if (grids.has(id)) {
        issues.push({ code: "duplicate-grid", severity: "error", message: `GRID ${id} is defined twice`, line: number })
      }
      grids.set(id, number)
      for (const value of [x, y, z]) {
        if (value !== undefined && !Number.isNaN(value) && parts.length > 3 && !Number.isFinite(value)) {
          issues.push({ code: "bad-coordinate", severity: "error", message: `GRID ${id} has a non numeric coordinate`, line: number })
          break
        }
      }
      records.push({ id: `grid:${id}`, kind: "grid", fields: { id, x: x || 0, y: y || 0, z: z || 0, line: number } })
      return
    }

    if (ELEMENTS.has(card)) {
      const id = Number(parts[1])
      const property = Number(parts[2])
      const refs = parts.slice(3).map(Number).filter((value) => Number.isFinite(value))
      if (!Number.isInteger(id) || id <= 0) {
        issues.push({ code: "bad-element-id", severity: "error", message: `${card} id must be a positive integer: ${parts[1]}`, line: number })
        return
      }
      records.push({
        id: `${card}:${id}`,
        kind: "element",
        fields: { card, id, property, nodes: refs.length, connectivity: refs.join(","), line: number },
      })
      return
    }

    if (PROPERTIES.has(card)) {
      const id = Number(parts[1])
      if (!Number.isInteger(id) || id <= 0) {
        issues.push({ code: "bad-property-id", severity: "error", message: `${card} id must be a positive integer: ${parts[1]}`, line: number })
      }
      records.push({ id: `${card}:${id || number}`, kind: "property", fields: { card, id, fields: parts.length, line: number } })
      return
    }

    records.push({ id: `${card}:${number}`, kind: "card", fields: { card, fields: parts.length, line: number } })
  })

  if (!sawEnd) {
    issues.push({ code: "missing-enddata", severity: "error", message: "File has no ENDDATA card" })
  }
  if (grids.size === 0) {
    issues.push({ code: "no-grids", severity: "warning", message: "Model defines no GRID points" })
  }

  for (const record of records) {
    if (record.kind !== "element") continue
    const refs = String(record.fields.connectivity ?? "").split(",").filter(Boolean).map(Number)
    for (const ref of refs) {
      if (!grids.has(ref)) {
        issues.push({
          code: "unknown-grid",
          severity: "warning",
          message: `${record.fields.card} ${record.fields.id} references GRID ${ref}, which is not defined`,
        })
        break
      }
    }
  }

  return {
    format: "Nastran BDF",
    records,
    meta: {
      cards: cardCount,
      grids: grids.size,
      elements: records.filter((record) => record.kind === "element").length,
      properties: records.filter((record) => record.kind === "property").length,
      format: text.includes(",") ? "free" : "fixed",
    },
    issues,
  }
}

const reference = [
  "Nastran bulk data file (BDF)",
  "",
  "GRID,1,,0.0,0.0,0.0",
  "CTRIA3,1,1,1,2,3",
  "PSHELL,1,1,0.1",
  "MAT1,1,2.1E11,,0.3",
  "ENDDATA",
  "",
  "Cards are comma separated (free field) or 8 character columns (fixed field).",
  "GRID is id, cp, x1, x2, x3.",
  "Element cards are id, property id, then grid ids.",
  "$ starts a comment.",
  "The file must end with ENDDATA.",
].join("\n")

export const format: FormatModule = {
  slug: "nastran-bdf",
  displayName: "Nastran BDF",
  extensions: [".bdf", ".dat", ".nas"],
  description: "Parse Nastran BDF cards, validate grids, elements and ENDDATA.",
  reference,
  parse,
  sample: () =>
    [
      "GRID,1,,0.0,0.0,0.0",
      "GRID,2,,1.0,0.0,0.0",
      "GRID,3,,1.0,1.0,0.0",
      "CTRIA3,1,1,1,2,3",
      "PSHELL,1,1,0.1",
      "MAT1,1,2.1E11,,0.3",
      "ENDDATA",
    ].join("\n") + "\n",
}
