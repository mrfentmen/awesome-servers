import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

const CLARITY = new Set(["FL", "IF", "VVS1", "VVS2", "VS1", "VS2", "SI1", "SI2", "I1", "I2", "I3"])
const CUT = new Set(["EXCELLENT", "VERY GOOD", "GOOD", "FAIR", "POOR"])
const COLORS = "DEFGHIJKLMNOPQRSTUVWXYZ".split("")

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
    return { format: "Gemstone", records, meta: { rows: 0 }, issues: [{ code: "empty", severity: "error", message: "File is empty" }] }
  }

  const header = splitRow(lines[0]).map((cell) => cell.toLowerCase())
  const index = (name: string) => header.indexOf(name)
  for (const required of ["stone", "carat", "color", "clarity", "cut"]) {
    if (index(required) < 0) issues.push({ code: "missing-column", severity: "error", message: `Header has no ${required} column`, line: 1 })
  }
  let totalCarat = 0

  lines.slice(1).forEach((line, offset) => {
    const number = offset + 2
    const cells = splitRow(line)
    if (cells.length !== header.length) {
      issues.push({ code: "bad-width", severity: "error", message: `Row has ${cells.length} cells, header has ${header.length}`, line: number })
      return
    }
    const carat = Number(cells[index("carat")])
    if (!Number.isFinite(carat) || carat <= 0) {
      issues.push({ code: "bad-carat", severity: "error", message: `Carat must be positive: ${cells[index("carat")]}`, line: number })
    } else {
      totalCarat += carat
    }
    const color = (cells[index("color")] ?? "").toUpperCase()
    if (color && !COLORS.includes(color)) {
      issues.push({ code: "bad-color", severity: "error", message: `Color must be D to Z: ${color}`, line: number })
    }
    const clarity = (cells[index("clarity")] ?? "").toUpperCase()
    if (clarity && !CLARITY.has(clarity)) {
      issues.push({ code: "bad-clarity", severity: "error", message: `Clarity must be FL, IF, VVS, VS, SI or I: ${clarity}`, line: number })
    }
    const cut = (cells[index("cut")] ?? "").toUpperCase()
    if (cut && !CUT.has(cut)) {
      issues.push({ code: "bad-cut", severity: "warning", message: `Unknown cut grade: ${cut}`, line: number })
    }

    records.push({ id: `stone:${number}`, kind: "stone", fields: { stone: cells[index("stone")] ?? "", carat: Number.isFinite(carat) ? carat : 0, color, clarity, cut, line: number } })
  })

  if (records.length === 0) issues.push({ code: "no-rows", severity: "error", message: "File has a header but no stones" })

  return {
    format: "Gemstone",
    records,
    meta: { rows: records.length, totalCarat: Number(totalCarat.toFixed(2)), stones: new Set(records.map((record) => record.fields.stone)).size },
    issues,
  }
}

const reference = [
  "Gemstone grading report (CSV, GIA 4C)",
  "",
  "Stone,Carat,Color,Clarity,Cut",
  "Diamond,1.02,G,VS1,Excellent",
  "Sapphire,2.40,,,Excellent",
  "",
  "Carat is a positive number.",
  "Color is D to Z for diamonds; clarity is FL, IF, VVS1..I3.",
  "Cut is Excellent, Very Good, Good, Fair or Poor.",
].join("\n")

export const format: FormatModule = {
  slug: "gemstone",
  displayName: "Gemstone",
  extensions: [".csv"],
  description: "Parse gemstone grading reports, validate carat, color, clarity and cut.",
  reference,
  parse,
  sample: () =>
    [
      "Stone,Carat,Color,Clarity,Cut",
      "Diamond,1.02,G,VS1,Excellent",
      "Diamond,0.75,E,VVS2,Very Good",
    ].join("\n") + "\n",
}
