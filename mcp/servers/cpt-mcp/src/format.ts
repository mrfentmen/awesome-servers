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
    return { format: "CPT", records, meta: { rows: 0 }, issues: [{ code: "empty", severity: "error", message: "File is empty" }] }
  }

  const header = splitRow(lines[0]).map((cell) => cell.toLowerCase())
  const index = (name: string) => header.indexOf(name)
  const codeIndex = index("code")
  if (codeIndex < 0) {
    issues.push({ code: "no-code", severity: "error", message: "Header has no Code column", line: 1 })
  }
  const sections = new Set<string>()
  let cpt = 0
  let hcpcs = 0

  lines.slice(1).forEach((line, offset) => {
    const number = offset + 2
    const cells = splitRow(line)
    if (cells.length !== header.length) {
      issues.push({ code: "bad-width", severity: "error", message: `Row has ${cells.length} cells, header has ${header.length}`, line: number })
      return
    }
    const code = cells[codeIndex] ?? ""
    if (/^\d{5}$/.test(code)) cpt += 1
    else if (/^[A-Z]\d{4}$/i.test(code)) hcpcs += 1
    else if (code) issues.push({ code: "bad-code", severity: "error", message: `CPT is 5 digits, HCPCS is a letter and 4 digits: ${code}`, line: number })

    const section = cells[index("section")] ?? ""
    if (section) sections.add(section)
    records.push({ id: `code:${code || number}`, kind: "code", fields: { code, description: cells[index("description")] ?? "", section, line: number } })
  })

  if (records.length === 0) {
    issues.push({ code: "no-rows", severity: "error", message: "File has a header but no codes" })
  }

  return {
    format: "CPT",
    records,
    meta: { rows: records.length, cpt, hcpcs, sections: sections.size },
    issues,
  }
}

const reference = [
  "CPT / HCPCS code list (CSV)",
  "",
  "Code,Description,Section",
  "99213,Office visit established patient,Evaluation and Management",
  "J1885,Injection ketorolac tromethamine,HCPCS Level II",
  "",
  "CPT codes are 5 digits. HCPCS Level II is a letter and 4 digits.",
  "Section groups the code range.",
].join("\n")

export const format: FormatModule = {
  slug: "cpt",
  displayName: "CPT",
  extensions: [".csv"],
  description: "Parse CPT and HCPCS code lists, validate code shapes and sections.",
  reference,
  parse,
  sample: () =>
    [
      "Code,Description,Section",
      "99213,Office visit established patient,Evaluation and Management",
      "J1885,Injection ketorolac tromethamine,HCPCS Level II",
    ].join("\n") + "\n",
}
