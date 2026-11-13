import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

const PREFIXES = ["WASH", "BLEACH", "TUMBLE", "IRON", "DRY", "PROFESSIONAL", "DO_NOT", "NATURAL"]

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
    return { format: "Care Label", records, meta: { rows: 0 }, issues: [{ code: "empty", severity: "error", message: "File is empty" }] }
  }

  const header = splitRow(lines[0]).map((cell) => cell.toLowerCase())
  const index = (name: string) => header.indexOf(name)
  if (index("code") < 0) issues.push({ code: "no-code", severity: "error", message: "Header has no Code column", line: 1 })
  const codes = new Set<string>()
  const families = new Set<string>()

  lines.slice(1).forEach((line, offset) => {
    const number = offset + 2
    const cells = splitRow(line)
    if (cells.length !== header.length) {
      issues.push({ code: "bad-width", severity: "error", message: `Row has ${cells.length} cells, header has ${header.length}`, line: number })
      return
    }
    const code = (cells[index("code")] ?? "").toUpperCase()
    if (!code) {
      issues.push({ code: "missing-code", severity: "error", message: "Row has no care code", line: number })
      return
    }
    const family = PREFIXES.find((prefix) => code === prefix || code.startsWith(`${prefix}_`))
    if (!family) {
      issues.push({ code: "unknown-code", severity: "error", message: `Unknown care code: ${code}`, line: number })
    } else {
      families.add(family)
    }
    if (codes.has(code)) issues.push({ code: "duplicate-code", severity: "error", message: `Code ${code} appears twice`, line: number })
    codes.add(code)

    records.push({ id: `care:${code || number}`, kind: "symbol", fields: { code, meaning: cells[index("meaning")] ?? "", line: number } })
  })

  if (records.length === 0) issues.push({ code: "no-rows", severity: "error", message: "File has a header but no care codes" })
  if (!families.has("WASH")) issues.push({ code: "no-wash", severity: "warning", message: "Label has no wash instruction" })

  return {
    format: "Care Label",
    records,
    meta: { rows: records.length, families: families.size, codes: codes.size },
    issues,
  }
}

const reference = [
  "GINETEX / ISO 3758 care label (CSV)",
  "",
  "Code,Meaning",
  "WASH_40,Machine wash at 40C",
  "BLEACH_NO,Do not bleach",
  "TUMBLE_LOW,Tumble dry low",
  "IRON_2,Iron at medium temperature",
  "DRY_CLEAN_P,Professional dry clean",
  "",
  "Codes start with WASH, BLEACH, TUMBLE, IRON, DRY_CLEAN or DO_NOT.",
  "Each code appears once; a wash instruction is expected.",
].join("\n")

export const format: FormatModule = {
  slug: "care-label",
  displayName: "Care Label",
  extensions: [".csv"],
  description: "Parse GINETEX care labels, validate wash, bleach, dry and iron codes.",
  reference,
  parse,
  sample: () =>
    [
      "Code,Meaning",
      "WASH_40,Machine wash at 40C",
      "BLEACH_NO,Do not bleach",
      "TUMBLE_LOW,Tumble dry low",
      "IRON_2,Iron at medium temperature",
    ].join("\n") + "\n",
}
