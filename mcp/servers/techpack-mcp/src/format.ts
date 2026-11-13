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
    return { format: "Tech Pack", records, meta: { rows: 0 }, issues: [{ code: "empty", severity: "error", message: "File is empty" }] }
  }

  const header = splitRow(lines[0]).map((cell) => cell.toLowerCase())
  const index = (name: string) => header.indexOf(name)
  for (const required of ["style", "fabric", "size", "quantity"]) {
    if (index(required) < 0) issues.push({ code: "missing-column", severity: "error", message: `Header has no ${required} column`, line: 1 })
  }
  const keys = new Set<string>()

  lines.slice(1).forEach((line, offset) => {
    const number = offset + 2
    const cells = splitRow(line)
    if (cells.length !== header.length) {
      issues.push({ code: "bad-width", severity: "error", message: `Row has ${cells.length} cells, header has ${header.length}`, line: number })
      return
    }
    const style = cells[index("style")] ?? ""
    const size = cells[index("size")] ?? ""
    if (!style) issues.push({ code: "missing-style", severity: "error", message: "Row has no style", line: number })
    const key = `${style}::${size}`
    if (keys.has(key)) issues.push({ code: "duplicate-line", severity: "error", message: `Style ${style} size ${size} appears twice`, line: number })
    keys.add(key)

    const quantity = Number(cells[index("quantity")] ?? "0")
    if (!Number.isInteger(quantity) || quantity <= 0) {
      issues.push({ code: "bad-quantity", severity: "error", message: `Quantity must be a positive integer: ${cells[index("quantity")]}`, line: number })
    }
    const cost = Number(cells[index("unitcost")] ?? "0")
    if (index("unitcost") >= 0 && cells[index("unitcost")] && !Number.isFinite(cost)) {
      issues.push({ code: "bad-cost", severity: "error", message: `Unit cost is not numeric: ${cells[index("unitcost")]}`, line: number })
    }

    records.push({ id: `line:${style}:${size}`, kind: "line", fields: { style, fabric: cells[index("fabric")] ?? "", colorway: cells[index("colorway")] ?? "", size, quantity: Number.isInteger(quantity) ? quantity : 0, line: number } })
  })

  if (records.length === 0) issues.push({ code: "no-rows", severity: "error", message: "File has a header but no lines" })

  return {
    format: "Tech Pack",
    records,
    meta: { rows: records.length, styles: new Set(records.map((record) => record.fields.style)).size, units: records.reduce((sum, record) => sum + Number(record.fields.quantity ?? 0), 0) },
    issues,
  }
}

const reference = [
  "Apparel tech pack (CSV)",
  "",
  "Style,Fabric,Colorway,Size,Quantity,UnitCost",
  "HOOD-01,French Terry,Black,M,500,12.50",
  "HOOD-01,French Terry,Black,L,300,12.50",
  "",
  "Style identifies the garment; size and colorway split the buy.",
  "Quantity is a positive integer per style and size.",
  "UnitCost is optional but must be numeric.",
].join("\n")

export const format: FormatModule = {
  slug: "techpack",
  displayName: "Tech Pack",
  extensions: [".csv"],
  description: "Parse apparel tech packs, validate styles, fabrics, sizes and quantities.",
  reference,
  parse,
  sample: () =>
    [
      "Style,Fabric,Colorway,Size,Quantity,UnitCost",
      "HOOD-01,French Terry,Black,M,500,12.50",
      "HOOD-01,French Terry,Black,L,300,12.50",
    ].join("\n") + "\n",
}
