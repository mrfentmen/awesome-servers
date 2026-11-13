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
    return { format: "Calypso", records, meta: { columns: 0, rows: 0 }, issues: [{ code: "empty", severity: "error", message: "File is empty" }] }
  }

  const header = splitRow(lines[0])
  const seen = new Set<string>()
  for (const column of header) {
    if (!column) {
      issues.push({ code: "empty-column", severity: "error", message: "Header has an empty column name", line: 1 })
    }
    if (seen.has(column)) {
      issues.push({ code: "duplicate-column", severity: "error", message: `Column ${column} appears twice`, line: 1 })
    }
    seen.add(column)
  }

  const amountColumn = header.findIndex((column) => /amount|notional/i.test(column))
  const dateColumn = header.findIndex((column) => /date/i.test(column))
  let total = 0

  lines.slice(1).forEach((line, offset) => {
    const number = offset + 2
    const cells = splitRow(line)
    if (cells.length !== header.length) {
      issues.push({ code: "row-width", severity: "error", message: `Row has ${cells.length} cells, header has ${header.length}`, line: number })
      return
    }
    body: for (const [index, cell] of cells.entries()) {
      const column = header[index] ?? ""
      if (index === amountColumn) {
        const amount = Number(cell.replace(/,/g, ""))
        if (!Number.isFinite(amount)) {
          issues.push({ code: "bad-amount", severity: "error", message: `Amount column ${column} is not numeric: ${cell}`, line: number })
        } else {
          total += amount
        }
      }
      if (index === dateColumn && cell && !/^\d{4}-\d{2}-\d{2}([T ].*)?$/.test(cell)) {
        issues.push({ code: "bad-date", severity: "error", message: `Date column ${column} is not ISO: ${cell}`, line: number })
      }
      if (cell === "" && index !== amountColumn) continue body
    }
    records.push({
      id: `row:${number}`,
      kind: "trade",
      fields: { line: number, cells: cells.length, first: cells[0] ?? "" },
    })
  })

  if (records.length === 0) {
    issues.push({ code: "no-rows", severity: "error", message: "File has a header but no trade rows" })
  }

  return {
    format: "Calypso",
    records,
    meta: {
      columns: header.length,
      rows: records.length,
      amountColumn: amountColumn >= 0 ? header[amountColumn] : "",
      totalAmount: Number(total.toFixed(2)),
    },
    issues,
  }
}

const reference = [
  "Calypso trade export (CSV)",
  "",
  "TradeId,Book,Currency,Amount,ValueDate",
  "T1,EQ,EUR,1000000,2026-11-12",
  "T2,FX,USD,250000.50,2026-11-13",
  "",
  "The first row is the header and every other row must match its width.",
  "Amount and Notional columns must be numeric.",
  "Date columns must be ISO (YYYY-MM-DD).",
  "Quoted cells may contain commas.",
].join("\n")

export const format: FormatModule = {
  slug: "calypso",
  displayName: "Calypso",
  extensions: [".csv"],
  description: "Parse Calypso trade export CSV, validate columns, amounts and dates.",
  reference,
  parse,
  sample: () =>
    [
      "TradeId,Book,Currency,Amount,ValueDate",
      "T1,EQ,EUR,1000000,2026-11-12",
      "T2,FX,USD,250000.50,2026-11-13",
    ].join("\n") + "\n",
}
