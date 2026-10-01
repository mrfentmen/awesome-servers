import ExcelJS from "exceljs"
import { writeFileSync, mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

export class ExcelError extends Error {}

function outPath(name: string): string {
  const safe = /^[\w.\- ]+$/.test(name) && name.endsWith(".xlsx") ? name : `workbook-${Date.now()}.xlsx`
  return join(mkdtempSync(join(tmpdir(), "xlsx-")), safe)
}

export async function createWorkbook(args: { sheet_name?: string; rows?: string; filename?: string }): Promise<string> {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet(args.sheet_name ?? "Sheet1")
  const lines = (args.rows ?? "").split("\n").map((l) => l.trim()).filter(Boolean)
  if (lines.length === 0) throw new ExcelError("Provide at least one row of comma separated values")
  for (const line of lines.slice(0, 500)) {
    const cells = line.split(",").map((c) => c.trim())
    const nums = cells.map((c) => (/^-?\d+(\.\d+)?$/.test(c) ? Number(c) : c))
    ws.addRow(nums)
  }
  const path = outPath(args.filename ?? `workbook-${Date.now()}.xlsx`)
  await wb.xlsx.writeFile(path)
  return `Created ${path} (${lines.length} rows)`
}

export async function readWorkbook(args: { path?: string; max_rows?: number }): Promise<string> {
  const path = args.path ?? ""
  if (!path) throw new ExcelError("Provide a path to an xlsx file")
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile(path)
  const ws = wb.worksheets[0]
  if (!ws) throw new ExcelError("The workbook has no sheets")
  const max = Math.min(args.max_rows ?? 20, 100)
  const out: string[] = []
  ws.eachRow({ includeEmpty: false }, (row, n) => {
    if (n > max) return
    const vals = (row.values as unknown[])
    out.push(`${n}. ${vals.slice(1).map((v) => String(v)).join(" | ")}`)
  })
  return `${ws.name} (${ws.rowCount} rows)\n${out.join("\n")}`
}

// ---- muxE tools:
// read_workbook prints the first rows of the first sheet as text, so the two new
// tools answer different questions about the same file: what each column
// actually contains, and which cells hold a formula. Both stay local, like the
// rest of this server, and use the exceljs copy already in the dependencies.
interface ProfileColumn {
  index: number
  letter: string
  label: string
  kind: string
  filled: number
  blank: number
  distinct: number
  numbers: number[]
  dates: number[]
  texts: Map<string, number>
  formulas: number
}

function columnLetter(index: number): string {
  let n = index
  let out = ""
  while (n > 0) {
    const rest = (n - 1) % 26
    out = String.fromCharCode(65 + rest) + out
    n = Math.floor((n - 1) / 26)
  }
  return out
}

function pickSheet(workbook: ExcelJS.Workbook, wanted?: string): ExcelJS.Worksheet {
  const sheets = workbook.worksheets
  if (!sheets.length) throw new ExcelError("The workbook has no sheets")
  const name = (wanted ?? "").trim()
  if (name) {
    const found = sheets.find((s) => s.name === name)
    if (!found) {
      throw new ExcelError(`The workbook has no sheet named "${name}". It has: ${sheets.slice(0, 20).map((s) => s.name).join(", ")}`)
    }
    return found
  }
  return sheets[0]
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

const show = (n: number): string => (Number.isInteger(n) ? String(n) : String(Number(n.toFixed(6))))

export async function workbookProfile(args: { path?: string; sheet?: string; max_rows?: number }): Promise<string> {
  const path = args.path ?? ""
  if (!path) throw new ExcelError("Provide a path to an xlsx file")
  const limit = Math.max(1, Math.min(Number(args.max_rows ?? 0) || 5000, 20000))
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile(path)
  const ws = pickSheet(wb, args.sheet)
  const columns = new Map<number, ProfileColumn>()
  const ensure = (index: number): ProfileColumn => {
    let col = columns.get(index)
    if (!col) {
      col = {
        index,
        letter: columnLetter(index),
        label: "",
        kind: "empty",
        filled: 0,
        blank: 0,
        distinct: 0,
        numbers: [],
        dates: [],
        texts: new Map(),
        formulas: 0,
      }
      columns.set(index, col)
    }
    return col
  }
  const seen = new Map<number, Set<string>>()
  let scanned = 0
  ws.eachRow({ includeEmpty: false }, (row) => {
    if (scanned >= limit) return
    scanned += 1
    row.eachCell({ includeEmpty: false }, (cell, index) => {
      const col = ensure(index)
      const value = cell.value as unknown
      if (typeof value === "object" && value !== null && ("formula" in value || "sharedFormula" in value)) {
        col.formulas += 1
      }
      if (value === null || value === undefined || value === "") {
        col.blank += 1
        return
      }
      col.filled += 1
      if (scanned === 1) col.label = String(typeof value === "object" ? JSON.stringify(value).slice(0, 40) : value).slice(0, 40)
      if (typeof value === "number" && Number.isFinite(value)) {
        col.numbers.push(value)
        const key = `n:${value}`
        if (!seen.has(index)) seen.set(index, new Set())
        seen.get(index)!.add(key)
        return
      }
      if (value instanceof Date && !Number.isNaN(value.getTime())) {
        col.dates.push(value.getTime())
        const key = `d:${value.getTime()}`
        if (!seen.has(index)) seen.set(index, new Set())
        seen.get(index)!.add(key)
        return
      }
      const text = String(value)
      col.texts.set(text, (col.texts.get(text) ?? 0) + 1)
      if (!seen.has(index)) seen.set(index, new Set())
      seen.get(index)!.add(text.slice(0, 120))
    })
  })
  if (!columns.size) return `Sheet "${ws.name}" holds no cells, so there is nothing to profile.`
  const lines = [
    `Profile of sheet "${ws.name}" in ${path}`,
    `  rows scanned: ${scanned}${scanned >= limit ? " (the scan limit for this call)" : ""}, columns found: ${columns.size}`,
  ]
  for (const col of [...columns.values()].sort((a, b) => a.index - b.index)) {
    const kinds: string[] = []
    if (col.numbers.length) kinds.push("number")
    if (col.dates.length) kinds.push("date")
    if (col.texts.size) kinds.push("text")
    if (col.formulas) kinds.push("formula")
    col.kind = kinds.length ? kinds.join(" and ") : "empty"
    col.distinct = seen.get(col.index)?.size ?? 0
    const name = col.label ? ` (${col.label})` : ""
    lines.push(`  column ${col.letter}${name}:`)
    lines.push(`    kind: ${col.kind}, ${col.filled} filled and ${col.blank} blank of ${scanned}, ${col.distinct} distinct value(s)`)
    if (col.formulas) lines.push(`    ${col.formulas} formula cell(s) in this column`)
    if (col.numbers.length) {
      const total = col.numbers.reduce((a, b) => a + b, 0)
      lines.push(
        `    numbers: ${col.numbers.length}, min ${show(Math.min(...col.numbers))}, max ${show(Math.max(...col.numbers))}, ` +
          `mean ${show(total / col.numbers.length)}, median ${show(median(col.numbers))}, sum ${show(total)}`,
      )
    }
    if (col.dates.length) {
      const first = new Date(Math.min(...col.dates)).toISOString().slice(0, 10)
      const last = new Date(Math.max(...col.dates)).toISOString().slice(0, 10)
      lines.push(`    dates: ${col.dates.length}, earliest ${first}, latest ${last}`)
    }
    if (col.texts.size) {
      const top = [...col.texts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
      lines.push(`    most frequent values: ${top.map(([v, n]) => `${JSON.stringify(v.slice(0, 40))} x${n}`).join(", ")}`)
      if (col.texts.size > 5) lines.push(`    and ${col.texts.size - 5} other distinct text value(s)`)
    }
  }
  lines.push("  every figure above is computed from the cells in the file, not from any stored summary.")
  return lines.join("\n")
}

export async function formulaReport(args: { path?: string; sheet?: string; max_formulas?: number }): Promise<string> {
  const path = args.path ?? ""
  if (!path) throw new ExcelError("Provide a path to an xlsx file")
  const cap = Math.max(1, Math.min(Number(args.max_formulas ?? 40) || 40, 200))
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile(path)
  const wanted = (args.sheet ?? "").trim()
  const sheets = wanted ? [pickSheet(wb, wanted)] : wb.worksheets
  if (!sheets.length) throw new ExcelError("The workbook has no sheets")
  const found: Array<{ sheet: string; address: string; text: string; result: string }> = []
  let errors = 0
  let blankResults = 0
  for (const ws of sheets) {
    ws.eachRow({ includeEmpty: false }, (row) => {
      row.eachCell({ includeEmpty: false }, (cell) => {
        const value = cell.value as { formula?: string; sharedFormula?: string; result?: unknown } | null
        if (typeof value !== "object" || value === null) return
        if (!("formula" in value) && !("sharedFormula" in value)) return
        const text = value.formula ?? (value.sharedFormula ? `${value.sharedFormula} (shared formula)` : "?")
        const result = value.result
        if (result && typeof result === "object" && "error" in (result as Record<string, unknown>)) {
          errors += 1
        }
        let shown: string
        if (result === null || result === undefined || result === "") {
          blankResults += 1
          shown = "not calculated, the file holds no cached result"
        } else {
          shown = String(typeof result === "object" ? JSON.stringify(result) : result)
        }
        found.push({ sheet: ws.name, address: cell.address, text, result: shown })
      })
    })
  }
  const head = [
    `Formula report for ${path}`,
    `  sheets scanned: ${sheets.map((s) => s.name).join(", ")}`,
    `  formula cells: ${found.length}`,
    `  of those, cached result is an error value: ${errors}`,
    `  of those, no cached result at all: ${blankResults}`,
  ]
  if (!found.length) {
    head.push("  the scanned sheets hold no formulas; every cell is a literal value.")
    return head.join("\n")
  }
  head.push(`  the first ${Math.min(cap, found.length)}, in sheet and cell order:`)
  for (const row of found.slice(0, cap)) {
    head.push(`    ${row.sheet}!${row.address} = ${row.text.slice(0, 120)}  ->  ${row.result.slice(0, 80)}`)
  }
  if (found.length > cap) head.push(`    and ${found.length - cap} more formula cell(s) not listed here`)
  head.push("  a cached result is whatever Excel last stored, so it can be stale if the file was edited outside Excel.")
  return head.join("\n")
}
