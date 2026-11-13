import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

function splitRow(line: string): string[] {
  const cells: string[] = []
  let value = ""
  let quoted = false
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        value += '"'
        index += 1
      } else {
        quoted = !quoted
      }
      continue
    }
    if (char === "," && !quoted) {
      cells.push(value.trim())
      value = ""
      continue
    }
    value += char
  }
  cells.push(value.trim())
  return cells
}

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0)
  if (lines.length === 0) {
    return { format: "Size Chart", records, meta: { rows: 0 }, issues: [{ code: "empty", severity: "error", message: "File is empty" }] }
  }

  const header = splitRow(lines[0]).map((cell) => cell.toLowerCase())
  const index = (name: string) => header.indexOf(name)
  for (const required of ["size", "chest", "waist", "hip"]) {
    if (index(required) < 0) issues.push({ code: "missing-column", severity: "error", message: `Header has no ${required} column`, line: 1 })
  }
  const sizes = new Set<string>()

  lines.slice(1).forEach((line, offset) => {
    const number = offset + 2
    const cells = splitRow(line)
    if (cells.length !== header.length) {
      issues.push({ code: "bad-width", severity: "error", message: `Row has ${cells.length} cells, header has ${header.length}`, line: number })
      return
    }
    const size = cells[index("size")] ?? ""
    if (!size) issues.push({ code: "missing-size", severity: "error", message: "Row has no size", line: number })
    if (sizes.has(size)) issues.push({ code: "duplicate-size", severity: "error", message: `Size ${size} appears twice`, line: number })
    sizes.add(size)

    const chest = Number(cells[index("chest")])
    const waist = Number(cells[index("waist")])
    const hip = Number(cells[index("hip")])
    for (const [label, value] of [["chest", chest], ["waist", waist], ["hip", hip]] as const) {
      if (!Number.isFinite(value) || value <= 0) {
        issues.push({ code: `bad-${label}`, severity: "error", message: `${label} must be a positive number: ${cells[index(label)]}`, line: number })
      }
    }
    if (Number.isFinite(chest) && Number.isFinite(waist) && chest <= waist) {
      issues.push({ code: "chest-not-larger", severity: "warning", message: `Chest ${chest} is not larger than waist ${waist}`, line: number })
    }
    if (Number.isFinite(hip) && Number.isFinite(waist) && hip < waist) {
      issues.push({ code: "hip-smaller", severity: "error", message: `Hip ${hip} is smaller than waist ${waist}`, line: number })
    }

    records.push({ id: `size:${size || number}`, kind: "size", fields: { size, chest, waist, hip, inseam: Number(cells[index("inseam")] ?? 0), line: number } })
  })

  if (records.length === 0) issues.push({ code: "no-rows", severity: "error", message: "File has a header but no sizes" })

  return {
    format: "Size Chart",
    records,
    meta: { rows: records.length, sizes: sizes.size, columns: header.length },
    issues,
  }
}

const reference = [
  "Apparel size chart (CSV, centimetres)",
  "",
  "Size,Chest,Waist,Hip,Inseam",
  "XS,86,71,91,78",
  "S,91,76,96,79",
  "",
  "Size labels must be unique.",
  "Chest, waist, hip and inseam are numbers in centimetres.",
  "Chest should be larger than waist; hip must not be smaller than waist.",
].join("\n")

export const format: FormatModule = {
  slug: "size-chart",
  displayName: "Size Chart",
  extensions: [".csv"],
  description: "Parse apparel size charts, validate size labels and body measurements.",
  reference,
  parse,
  sample: () =>
    [
      "Size,Chest,Waist,Hip,Inseam",
      "XS,86,71,91,78",
      "S,91,76,96,79",
    ].join("\n") + "\n",
}
