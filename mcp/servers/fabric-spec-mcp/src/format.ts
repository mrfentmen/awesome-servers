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
    return { format: "Fabric Spec", records, meta: { rows: 0 }, issues: [{ code: "empty", severity: "error", message: "File is empty" }] }
  }

  const header = splitRow(lines[0]).map((cell) => cell.toLowerCase())
  const index = (name: string) => header.indexOf(name)
  for (const required of ["composition", "weight_gsm", "width_cm"]) {
    if (index(required) < 0) issues.push({ code: "missing-column", severity: "error", message: `Header has no ${required} column`, line: 1 })
  }
  const compositions = new Set<string>()

  lines.slice(1).forEach((line, offset) => {
    const number = offset + 2
    const cells = splitRow(line)
    if (cells.length !== header.length) {
      issues.push({ code: "bad-width", severity: "error", message: `Row has ${cells.length} cells, header has ${header.length}`, line: number })
      return
    }
    const composition = cells[index("composition")] ?? ""
    if (composition && !/%/.test(composition)) {
      issues.push({ code: "composition-without-percent", severity: "warning", message: `Composition has no percentages: ${composition}`, line: number })
    }
    compositions.add(composition)

    const weight = Number(cells[index("weight_gsm")])
    if (!Number.isFinite(weight) || weight <= 0) {
      issues.push({ code: "bad-weight", severity: "error", message: `Weight must be a positive number of gsm: ${cells[index("weight_gsm")]}`, line: number })
    }
    const width = Number(cells[index("width_cm")])
    if (!Number.isFinite(width) || width <= 0) {
      issues.push({ code: "bad-width-value", severity: "error", message: `Width must be a positive number of cm: ${cells[index("width_cm")]}`, line: number })
    }
    const shrinkage = Number(cells[index("shrinkage_pct")] ?? "0")
    if (index("shrinkage_pct") >= 0 && cells[index("shrinkage_pct")] && (!Number.isFinite(shrinkage) || shrinkage < 0 || shrinkage > 15)) {
      issues.push({ code: "bad-shrinkage", severity: "warning", message: `Shrinkage looks wrong: ${cells[index("shrinkage_pct")]}%`, line: number })
    }

    records.push({ id: `fabric:${composition || number}`, kind: "fabric", fields: { composition, weight: Number.isFinite(weight) ? weight : 0, width: Number.isFinite(width) ? width : 0, shrinkage: Number.isFinite(shrinkage) ? shrinkage : 0, weave: cells[index("weave")] ?? "", line: number } })
  })

  if (records.length === 0) issues.push({ code: "no-rows", severity: "error", message: "File has a header but no fabrics" })

  return {
    format: "Fabric Spec",
    records,
    meta: { rows: records.length, compositions: compositions.size, averageWeight: records.length ? Number((records.reduce((sum, record) => sum + Number(record.fields.weight ?? 0), 0) / records.length).toFixed(1)) : 0 },
    issues,
  }
}

const reference = [
  "Fabric specification sheet (CSV)",
  "",
  "Composition,Weight_gsm,Width_cm,Shrinkage_pct,Weave",
  "100% Cotton,180,150,3,Plain",
  "95% Cotton 5% Elastane,220,160,5,Twill",
  "",
  "Composition lists fibres with percentages.",
  "Weight is grams per square metre; width is centimetres.",
  "Shrinkage is a percentage after washing.",
].join("\n")

export const format: FormatModule = {
  slug: "fabric-spec",
  displayName: "Fabric Spec",
  extensions: [".csv"],
  description: "Parse fabric specs, validate composition, weight, width and shrinkage.",
  reference,
  parse,
  sample: () =>
    [
      "Composition,Weight_gsm,Width_cm,Shrinkage_pct,Weave",
      "100% Cotton,180,150,3,Plain",
      "95% Cotton 5% Elastane,220,160,5,Twill",
    ].join("\n") + "\n",
}
