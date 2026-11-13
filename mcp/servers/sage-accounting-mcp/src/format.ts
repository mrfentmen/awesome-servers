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
    return { format: "Sage", records, meta: { rows: 0 }, issues: [{ code: "empty", severity: "error", message: "File is empty" }] }
  }

  const header = splitRow(lines[0]).map((cell) => cell.toLowerCase())
  for (const required of ["date", "debit", "credit"]) {
    if (!header.includes(required)) {
      issues.push({ code: "missing-column", severity: "error", message: `Header has no ${required} column`, line: 1 })
    }
  }
  const dateIndex = header.indexOf("date")
  const debitIndex = header.indexOf("debit")
  const creditIndex = header.indexOf("credit")
  const referenceIndex = header.indexOf("reference")

  let debitTotal = 0
  let creditTotal = 0

  lines.slice(1).forEach((line, offset) => {
    const number = offset + 2
    const cells = splitRow(line)
    if (cells.length !== header.length) {
      issues.push({ code: "row-width", severity: "error", message: `Row has ${cells.length} cells, header has ${header.length}`, line: number })
      return
    }

    const date = cells[dateIndex] ?? ""
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date) && !/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
      issues.push({ code: "bad-date", severity: "error", message: `Date is not ISO or DD/MM/YYYY: ${date}`, line: number })
    }

    const debit = Number((cells[debitIndex] ?? "0").replace(/,/g, ""))
    const credit = Number((cells[creditIndex] ?? "0").replace(/,/g, ""))
    if (!Number.isFinite(debit)) {
      issues.push({ code: "bad-debit", severity: "error", message: `Debit is not numeric: ${cells[debitIndex]}`, line: number })
    }
    if (!Number.isFinite(credit)) {
      issues.push({ code: "bad-credit", severity: "error", message: `Credit is not numeric: ${cells[creditIndex]}`, line: number })
    }
    if (debit === 0 && credit === 0) {
      issues.push({ code: "empty-posting", severity: "warning", message: "Row has neither debit nor credit", line: number })
    }
    debitTotal += Number.isFinite(debit) ? debit : 0
    creditTotal += Number.isFinite(credit) ? credit : 0

    records.push({
      id: `posting:${number}`,
      kind: "posting",
      fields: { date, reference: cells[referenceIndex] ?? "", debit: Number.isFinite(debit) ? debit : 0, credit: Number.isFinite(credit) ? credit : 0, line: number },
    })
  })

  if (records.length === 0) {
    issues.push({ code: "no-rows", severity: "error", message: "File has a header but no postings" })
  }

  return {
    format: "Sage",
    records,
    meta: {
      rows: records.length,
      debitTotal: Number(debitTotal.toFixed(2)),
      creditTotal: Number(creditTotal.toFixed(2)),
      difference: Number((debitTotal - creditTotal).toFixed(2)),
    },
    issues,
  }
}

const reference = [
  "Sage accounting ledger export (CSV)",
  "",
  "Date,Reference,Nominal,Description,Debit,Credit",
  "2026-11-01,SI1,4000,Sales,0,1200.00",
  "2026-11-02,PI1,5000,Purchase,300.00,0",
  "",
  "The header needs date, debit and credit columns.",
  "Dates are ISO (YYYY-MM-DD) or DD/MM/YYYY.",
  "Debit and credit must be numeric.",
  "Totals and the difference are reported.",
].join("\n")

export const format: FormatModule = {
  slug: "sage-accounting",
  displayName: "Sage",
  extensions: [".csv"],
  description: "Parse Sage ledger CSV exports, validate dates, debits and credits.",
  reference,
  parse,
  sample: () =>
    [
      "Date,Reference,Nominal,Description,Debit,Credit",
      "2026-11-01,SI1,4000,Sales,0,1200.00",
      "2026-11-02,PI1,5000,Purchase,300.00,0",
    ].join("\n") + "\n",
}
