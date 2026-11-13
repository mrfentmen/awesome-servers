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
    return { format: "LOINC", records, meta: { rows: 0 }, issues: [{ code: "empty", severity: "error", message: "File is empty" }] }
  }

  const header = splitRow(lines[0]).map((cell) => cell.toUpperCase())
  const index = (name: string) => header.indexOf(name)
  const numberIndex = index("LOINC_NUM")
  if (numberIndex < 0) {
    issues.push({ code: "no-loinc-num", severity: "error", message: "Header has no LOINC_NUM column", line: 1 })
  }
  const componentIndex = index("COMPONENT")
  const statusIndex = index("STATUS")

  lines.slice(1).forEach((line, offset) => {
    const number = offset + 2
    const cells = splitRow(line)
    if (cells.length !== header.length) {
      issues.push({ code: "bad-width", severity: "error", message: `Row has ${cells.length} cells, header has ${header.length}`, line: number })
      return
    }
    const code = cells[numberIndex] ?? ""
    if (!/^\d{1,5}-\d$/.test(code)) {
      issues.push({ code: "bad-loinc", severity: "error", message: `LOINC number must look like 718-7: ${code}`, line: number })
    }
    if (statusIndex >= 0 && cells[statusIndex] && !/^(ACTIVE|DEPRECATED|DISCOURAGED|TRIAL)$/i.test(cells[statusIndex])) {
      issues.push({ code: "bad-status", severity: "warning", message: `Unknown status: ${cells[statusIndex]}`, line: number })
    }
    records.push({
      id: `loinc:${code || number}`,
      kind: "test",
      fields: { code, component: componentIndex >= 0 ? cells[componentIndex] : "", status: statusIndex >= 0 ? cells[statusIndex] : "", line: number },
    })
  })

  return {
    format: "LOINC",
    records,
    meta: { rows: records.length, columns: header.length, active: records.filter((record) => record.fields.status === "ACTIVE").length },
    issues,
  }
}

const reference = [
  "LOINC table export (CSV)",
  "",
  "LOINC_NUM,COMPONENT,PROPERTY,TIME_ASPCT,SYSTEM,SCALE_TYP,METHOD_TYP,CLASS,STATUS",
  "718-7,Hemoglobin,Mass/Vol,Point,Blood,Qn,,HEM/BC,ACTIVE",
  "",
  "LOINC_NUM is 1 to 5 digits, a hyphen, then a check digit.",
  "STATUS is ACTIVE, DEPRECATED, DISCOURAGED or TRIAL.",
  "Quoted cells may contain commas.",
].join("\n")

export const format: FormatModule = {
  slug: "loinc",
  displayName: "LOINC",
  extensions: [".csv"],
  description: "Parse LOINC table exports, validate LOINC numbers and status.",
  reference,
  parse,
  sample: () =>
    [
      "LOINC_NUM,COMPONENT,PROPERTY,TIME_ASPCT,SYSTEM,SCALE_TYP,METHOD_TYP,CLASS,STATUS",
      "718-7,Hemoglobin,Mass/Vol,Point,Blood,Qn,,HEM/BC,ACTIVE",
      "2345-7,Glucose,Mass/Vol,Point,Serum/Plasma,Qn,,CHEM,ACTIVE",
    ].join("\n") + "\n",
}
