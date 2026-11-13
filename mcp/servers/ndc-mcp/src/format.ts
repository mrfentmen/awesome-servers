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
    return { format: "NDC", records, meta: { rows: 0 }, issues: [{ code: "empty", severity: "error", message: "File is empty" }] }
  }

  const header = splitRow(lines[0]).map((cell) => cell.toUpperCase())
  const index = (name: string) => header.indexOf(name)
  const ndcIndex = index("PRODUCTNDC")
  if (ndcIndex < 0) {
    issues.push({ code: "no-ndc", severity: "error", message: "Header has no PRODUCTNDC column", line: 1 })
  }
  const routes = new Set<string>()

  lines.slice(1).forEach((line, offset) => {
    const number = offset + 2
    const cells = splitRow(line)
    if (cells.length !== header.length) {
      issues.push({ code: "bad-width", severity: "error", message: `Row has ${cells.length} cells, header has ${header.length}`, line: number })
      return
    }
    const ndc = cells[ndcIndex] ?? ""
    if (ndc && !/^\d{4,5}-\d{3,4}(-\d{1,2})?$/.test(ndc)) {
      issues.push({ code: "bad-ndc", severity: "error", message: `NDC must be 4-5 digits, 3-4 digits, optional package: ${ndc}`, line: number })
    }
    const route = cells[index("ROUTE")] ?? ""
    if (route) routes.add(route)
    records.push({
      id: `ndc:${ndc || number}`,
      kind: "product",
      fields: { ndc, name: cells[index("PROPRIETARYNAME")] ?? "", form: cells[index("DOSAGEFORMNAME")] ?? "", route, labeler: cells[index("LABELERNAME")] ?? "", line: number },
    })
  })

  if (records.length === 0) {
    issues.push({ code: "no-rows", severity: "error", message: "File has a header but no products" })
  }

  return {
    format: "NDC",
    records,
    meta: { rows: records.length, routes: routes.size, labelers: new Set(records.map((record) => record.fields.labeler)).size },
    issues,
  }
}

const reference = [
  "FDA NDC directory export (CSV)",
  "",
  "PRODUCTNDC,PRODUCTTYPENAME,PROPRIETARYNAME,DOSAGEFORMNAME,ROUTE,LABELERNAME",
  "0002-1433,HUMAN PRESCRIPTION DRUG,Strattera,CAPSULE,ORAL,Eli Lilly",
  "",
  "PRODUCTNDC is labeler (4 to 5 digits), product (3 to 4 digits), optional package.",
  "ROUTE names how the drug is taken.",
  "One row per packaged product.",
].join("\n")

export const format: FormatModule = {
  slug: "ndc",
  displayName: "NDC",
  extensions: [".csv"],
  description: "Parse FDA NDC directory exports, validate NDC codes and routes.",
  reference,
  parse,
  sample: () =>
    [
      "PRODUCTNDC,PRODUCTTYPENAME,PROPRIETARYNAME,DOSAGEFORMNAME,ROUTE,LABELERNAME",
      "0002-1433,HUMAN PRESCRIPTION DRUG,Strattera,CAPSULE,ORAL,Eli Lilly",
      "0002-4462,HUMAN PRESCRIPTION DRUG,Cymbalta,CAPSULE,ORAL,Eli Lilly",
    ].join("\n") + "\n",
}
