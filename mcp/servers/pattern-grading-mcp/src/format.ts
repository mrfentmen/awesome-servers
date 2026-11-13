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
    return { format: "Pattern Grading", records, meta: { rows: 0 }, issues: [{ code: "empty", severity: "error", message: "File is empty" }] }
  }

  const header = splitRow(lines[0]).map((cell) => cell.toLowerCase())
  const index = (name: string) => header.indexOf(name)
  const sizeIndex = index("size")
  if (sizeIndex < 0) {
    issues.push({ code: "no-size", severity: "error", message: "Header has no Size column", line: 1 })
  }
  const sizes = new Set<string>()
  let hasBase = false

  lines.slice(1).forEach((line, offset) => {
    const number = offset + 2
    const cells = splitRow(line)
    if (cells.length !== header.length) {
      issues.push({ code: "bad-width", severity: "error", message: `Row has ${cells.length} cells, header has ${header.length}`, line: number })
      return
    }
    const size = cells[sizeIndex] ?? ""
    if (!size) issues.push({ code: "missing-size", severity: "error", message: "Row has no size", line: number })
    if (sizes.has(size)) issues.push({ code: "duplicate-size", severity: "error", message: `Size ${size} appears twice`, line: number })
    sizes.add(size)

    for (const dimension of ["chest", "waist", "hip"]) {
      const column = index(`increment${dimension}`) >= 0 ? index(`increment${dimension}`) : index(`increment_${dimension}`)
      if (column < 0) continue
      const increment = Number(cells[column])
      if (!Number.isFinite(increment)) {
        issues.push({ code: `bad-increment-${dimension}`, severity: "error", message: `${dimension} increment is not numeric: ${cells[column]}`, line: number })
      } else if (increment < 0) {
        issues.push({ code: `negative-increment-${dimension}`, severity: "error", message: `${dimension} increment must not be negative: ${increment}`, line: number })
      }
    }
    if (/^(base|yes|true|1)$/i.test(cells[index("base")] ?? "")) hasBase = true

    records.push({ id: `grade:${size || number}`, kind: "grade", fields: { size, chest: Number(cells[index("incrementchest")] ?? cells[index("increment_chest")] ?? 0), waist: Number(cells[index("incrementwaist")] ?? cells[index("increment_waist")] ?? 0), hip: Number(cells[index("incrementhip")] ?? cells[index("increment_hip")] ?? 0), line: number } })
  })

  if (records.length === 0) issues.push({ code: "no-rows", severity: "error", message: "File has a header but no grading rows" })
  if (records.length > 0 && !hasBase) issues.push({ code: "no-base", severity: "warning", message: "No row is marked as the base size" })

  return {
    format: "Pattern Grading",
    records,
    meta: { rows: records.length, sizes: sizes.size, hasBase },
    issues,
  }
}

const reference = [
  "Pattern grading rules (CSV)",
  "",
  "Size,Base,IncrementChest,IncrementWaist,IncrementHip",
  "S,1,0,0,0",
  "M,,2,2,2",
  "L,,2,2,2",
  "",
  "Base marks the size the pattern is drafted at.",
  "Increments are centimetres added per step, never negative.",
  "Sizes must be unique.",
].join("\n")

export const format: FormatModule = {
  slug: "pattern-grading",
  displayName: "Pattern Grading",
  extensions: [".csv"],
  description: "Parse pattern grading rules, validate sizes, base size and increments.",
  reference,
  parse,
  sample: () =>
    [
      "Size,Base,IncrementChest,IncrementWaist,IncrementHip",
      "S,1,0,0,0",
      "M,,2,2,2",
      "L,,2,2,2",
    ].join("\n") + "\n",
}
