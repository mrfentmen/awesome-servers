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

function minutesOf(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time)
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) return null
  return hours * 60 + minutes
}

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0)
  if (lines.length === 0) {
    return { format: "UKG Kronos", records, meta: { rows: 0 }, issues: [{ code: "empty", severity: "error", message: "File is empty" }] }
  }

  const header = splitRow(lines[0]).map((cell) => cell.toLowerCase())
  for (const required of ["employee", "date", "in", "out", "hours"]) {
    if (!header.includes(required)) {
      issues.push({ code: "missing-column", severity: "error", message: `Header has no ${required} column`, line: 1 })
    }
  }
  const employeeIndex = header.indexOf("employee")
  const dateIndex = header.indexOf("date")
  const inIndex = header.indexOf("in")
  const outIndex = header.indexOf("out")
  const hoursIndex = header.indexOf("hours")
  let totalHours = 0

  lines.slice(1).forEach((line, offset) => {
    const number = offset + 2
    const cells = splitRow(line)
    if (cells.length !== header.length) {
      issues.push({ code: "row-width", severity: "error", message: `Row has ${cells.length} cells, header has ${header.length}`, line: number })
      return
    }

    const employee = cells[employeeIndex] ?? ""
    if (!employee) {
      issues.push({ code: "missing-employee", severity: "error", message: "Row has no employee", line: number })
    }
    const date = cells[dateIndex] ?? ""
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      issues.push({ code: "bad-date", severity: "error", message: `Date is not ISO: ${date}`, line: number })
    }

    const start = minutesOf(cells[inIndex] ?? "")
    const end = minutesOf(cells[outIndex] ?? "")
    if (start === null) issues.push({ code: "bad-in", severity: "error", message: `In time is not HH:MM: ${cells[inIndex]}`, line: number })
    if (end === null) issues.push({ code: "bad-out", severity: "error", message: `Out time is not HH:MM: ${cells[outIndex]}`, line: number })

    const hours = Number(cells[hoursIndex])
    if (!Number.isFinite(hours)) {
      issues.push({ code: "bad-hours", severity: "error", message: `Hours is not numeric: ${cells[hoursIndex]}`, line: number })
    } else if (start !== null && end !== null) {
      const worked = (end - start) / 60
      if (Math.abs(worked - hours) > 0.25) {
        issues.push({ code: "hours-mismatch", severity: "warning", message: `Hours ${hours} does not match ${cells[inIndex]}-${cells[outIndex]} (${worked.toFixed(2)})`, line: number })
      }
      totalHours += hours
    }

    records.push({
      id: `punch:${number}`,
      kind: "punch",
      fields: { employee, date, in: cells[inIndex] ?? "", out: cells[outIndex] ?? "", hours: Number.isFinite(hours) ? hours : 0, line: number },
    })
  })

  if (records.length === 0) {
    issues.push({ code: "no-rows", severity: "error", message: "File has a header but no punches" })
  }

  return {
    format: "UKG Kronos",
    records,
    meta: {
      rows: records.length,
      employees: new Set(records.map((record) => record.fields.employee)).size,
      totalHours: Number(totalHours.toFixed(2)),
    },
    issues,
  }
}

const reference = [
  "UKG Kronos timecard export (CSV)",
  "",
  "Employee,Date,In,Out,Hours",
  "E100,2026-11-10,08:00,16:30,8.5",
  "E101,2026-11-10,09:00,17:00,8.0",
  "",
  "The header needs employee, date, in, out and hours columns.",
  "Dates are ISO (YYYY-MM-DD); times are HH:MM (24 hour).",
  "Hours must be numeric and should match out minus in.",
].join("\n")

export const format: FormatModule = {
  slug: "ukg-kronos",
  displayName: "UKG Kronos",
  extensions: [".csv"],
  description: "Parse UKG Kronos timecard CSVs, validate times, hours and dates.",
  reference,
  parse,
  sample: () =>
    [
      "Employee,Date,In,Out,Hours",
      "E100,2026-11-10,08:00,16:30,8.5",
      "E101,2026-11-10,09:00,17:00,8.0",
    ].join("\n") + "\n",
}
