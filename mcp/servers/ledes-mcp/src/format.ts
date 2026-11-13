import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter((line) => line.length > 0)

  if (lines.length === 0) {
    return { format: "LEDES", records, meta: { fields: 0, rows: 0 }, issues: [{ code: "empty", severity: "error", message: "File is empty" }] }
  }
  if (!/^LEDES1998B\[\]$/.test(lines[0])) {
    issues.push({ code: "bad-magic", severity: "error", message: "First line must be LEDES1998B[]" })
  }

  const strip = (value: string): string => value.replace(/\[\]$/, "")
  const headerLine = lines.find((line) => line.includes("|"))
  if (!headerLine) {
    return { format: "LEDES", records, meta: { fields: 0, rows: 0 }, issues: [...issues, { code: "no-header", severity: "error", message: "File has no header row" }] }
  }
  const headerIndex = lines.indexOf(headerLine)
  const fields = strip(headerLine).split("|").map((field) => field.trim())
  const dateIndex = fields.indexOf("INVOICE_DATE")
  const totalIndex = fields.indexOf("INVOICE_TOTAL")

  let rows = 0
  let total = 0
  for (const [index, line] of lines.slice(headerIndex + 1).entries()) {
    const lineNo = headerIndex + index + 2
    if (!line.endsWith("[]")) {
      issues.push({ code: "missing-terminator", severity: "error", message: "Data row must end with []", line: lineNo })
    }
    const values = strip(line).split("|").map((value) => value.trim())
    if (values.length !== fields.length) {
      issues.push({ code: "field-count", severity: "error", message: `Expected ${fields.length} fields, found ${values.length}`, line: lineNo })
      continue
    }
    if (dateIndex >= 0 && !/^\d{8}$/.test(values[dateIndex] ?? "")) {
      issues.push({ code: "bad-date", severity: "error", message: `INVOICE_DATE must be YYYYMMDD: ${values[dateIndex] ?? ""}`, line: lineNo })
    }
    if (totalIndex >= 0) {
      const value = Number(values[totalIndex])
      if (!Number.isFinite(value)) {
        issues.push({ code: "bad-total", severity: "error", message: `INVOICE_TOTAL is not numeric: ${values[totalIndex] ?? ""}`, line: lineNo })
      } else {
        total += value
      }
    }
    rows += 1
    records.push({ id: `row:${rows}`, kind: "invoice", fields: { line: lineNo, invoiceNumber: values[fields.indexOf("INVOICE_NUMBER")] ?? "" } })
  }

  if (rows === 0) issues.push({ code: "no-rows", severity: "error", message: "File has no data rows" })
  if (!fields.includes("INVOICE_DATE")) issues.push({ code: "no-date-field", severity: "error", message: "Header has no INVOICE_DATE field" })

  return {
    format: "LEDES",
    records,
    meta: { fields: fields.length, rows, total: Number(total.toFixed(2)), format: "1998B" },
    issues,
  }
}

const reference = [
  "LEDES 1998B legal invoice",
  "",
  "LEDES1998B[]",
  "INVOICE_DATE|INVOICE_NUMBER|CLIENT_ID|LAW_FIRM_MATTER_ID|INVOICE_TOTAL|[]",
  "20261101|INV-1|CLIENT1|MATTER1|1250.00|[]",
  "",
  "First line is LEDES1998B[].",
  "The header lists fields separated by |.",
  "Each data row has the same number of fields and ends with [].",
  "INVOICE_DATE uses YYYYMMDD.",
].join("\n")

export const format: FormatModule = {
  slug: "ledes",
  displayName: "LEDES",
  extensions: [".txt", ".ledes"],
  description: "Parse LEDES 1998B invoices, validate header, field counts and dates.",
  reference,
  parse,
  sample: () =>
    [
      "LEDES1998B[]",
      "INVOICE_DATE|INVOICE_NUMBER|CLIENT_ID|LAW_FIRM_MATTER_ID|INVOICE_TOTAL|[]",
      "20261101|INV-1|CLIENT1|MATTER1|1250.00|[]",
      "20261101|INV-2|CLIENT1|MATTER2|800.50|[]",
    ].join("\n") + "\n",
}
