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
    return { format: "Shoe Size", records, meta: { rows: 0 }, issues: [{ code: "empty", severity: "error", message: "File is empty" }] }
  }

  const header = splitRow(lines[0]).map((cell) => cell.toLowerCase())
  const index = (name: string) => header.indexOf(name)
  for (const required of ["eu", "us_men", "uk", "jp_cm"]) {
    if (index(required) < 0) issues.push({ code: "missing-column", severity: "error", message: `Header has no ${required} column`, line: 1 })
  }
  const eus = new Set<number>()

  lines.slice(1).forEach((line, offset) => {
    const number = offset + 2
    const cells = splitRow(line)
    if (cells.length !== header.length) {
      issues.push({ code: "bad-width", severity: "error", message: `Row has ${cells.length} cells, header has ${header.length}`, line: number })
      return
    }
    const eu = Number(cells[index("eu")])
    const jp = Number(cells[index("jp_cm")])
    if (!Number.isFinite(eu) || eu < 15 || eu > 60) {
      issues.push({ code: "bad-eu", severity: "error", message: `EU size must be 15 to 60: ${cells[index("eu")]}`, line: number })
    }
    if (eus.has(eu)) issues.push({ code: "duplicate-eu", severity: "error", message: `EU size ${eu} appears twice`, line: number })
    eus.add(eu)
    if (!Number.isFinite(jp) || jp < 10 || jp > 35) {
      issues.push({ code: "bad-jp", severity: "error", message: `JP length must be 10 to 35 cm: ${cells[index("jp_cm")]}`, line: number })
    }
    if (Number.isFinite(eu) && Number.isFinite(jp) && Math.abs(eu / 1.5 - jp - 10.5) > 2.5) {
      issues.push({ code: "size-mismatch", severity: "warning", message: `EU ${eu} and JP ${jp} cm look inconsistent`, line: number })
    }

    records.push({ id: `size:${cells[index("eu")] ?? number}`, kind: "size", fields: { eu: Number.isFinite(eu) ? eu : 0, usMen: Number(cells[index("us_men")] ?? 0), usWomen: Number(cells[index("us_women")] ?? 0), uk: Number(cells[index("uk")] ?? 0), jp: Number.isFinite(jp) ? jp : 0, line: number } })
  })

  if (records.length === 0) issues.push({ code: "no-rows", severity: "error", message: "File has a header but no sizes" })

  return {
    format: "Shoe Size",
    records,
    meta: { rows: records.length, systems: "EU,US_Men,US_Women,UK,JP_CM", euRange: records.length ? `${Math.min(...records.map((record) => Number(record.fields.eu)))}-${Math.max(...records.map((record) => Number(record.fields.eu)))}` : "" },
    issues,
  }
}

const reference = [
  "Shoe size conversion table (CSV)",
  "",
  "EU,US_Men,US_Women,UK,JP_CM",
  "40,7,8.5,6.5,25.5",
  "41,8,9.5,7,26",
  "",
  "EU sizes run 15 to 60; JP is foot length in centimetres.",
  "Each EU size appears once.",
  "US and UK columns may be empty for children's ranges.",
].join("\n")

export const format: FormatModule = {
  slug: "shoe-size",
  displayName: "Shoe Size",
  extensions: [".csv"],
  description: "Parse shoe size tables, validate EU, US, UK and JP conversions.",
  reference,
  parse,
  sample: () =>
    [
      "EU,US_Men,US_Women,UK,JP_CM",
      "40,7,8.5,6.5,25.5",
      "41,8,9.5,7,26",
      "42,9,10.5,8,26.5",
    ].join("\n") + "\n",
}
