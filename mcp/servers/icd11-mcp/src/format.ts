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
    return { format: "ICD-11", records, meta: { rows: 0 }, issues: [{ code: "empty", severity: "error", message: "File is empty" }] }
  }

  const header = splitRow(lines[0]).map((cell) => cell.toLowerCase())
  const index = (name: string) => header.indexOf(name)
  const codeIndex = index("code")
  if (codeIndex < 0) {
    issues.push({ code: "no-code", severity: "error", message: "Header has no Code column", line: 1 })
  }
  const chapters = new Set<string>()

  lines.slice(1).forEach((line, offset) => {
    const number = offset + 2
    const cells = splitRow(line)
    if (cells.length !== header.length) {
      issues.push({ code: "bad-width", severity: "error", message: `Row has ${cells.length} cells, header has ${header.length}`, line: number })
      return
    }
    const code = cells[codeIndex] ?? ""
    if (code && !/^\d[A-Z0-9]{1,3}(\.[A-Z0-9]{1,3})?$/.test(code)) {
      issues.push({ code: "bad-code", severity: "error", message: `ICD-11 code looks like 1A00 or 8A80.0: ${code}`, line: number })
    }
    const chapter = cells[index("chapter")] ?? ""
    if (chapter) chapters.add(chapter)
    records.push({
      id: `icd11:${code || number}`,
      kind: "entry",
      fields: { code, title: cells[index("title")] ?? "", kind: cells[index("classkind")] ?? "", chapter, line: number },
    })
  })

  if (records.length === 0) {
    issues.push({ code: "no-rows", severity: "error", message: "File has a header but no codes" })
  }

  return {
    format: "ICD-11",
    records,
    meta: { rows: records.length, chapters: chapters.size, columns: header.length },
    issues,
  }
}

const reference = [
  "ICD-11 tabulation export (CSV)",
  "",
  "Code,Title,ClassKind,Chapter",
  "1A00,Cholera,Category,01 Certain infectious or parasitic diseases",
  "8A80.0,Epilepsy,Category,08 Diseases of the nervous system",
  "",
  "Codes start with a digit, then 1 to 3 letters or digits, optional dot suffix.",
  "Chapter names group the code blocks.",
].join("\n")

export const format: FormatModule = {
  slug: "icd11",
  displayName: "ICD-11",
  extensions: [".csv"],
  description: "Parse ICD-11 tabulation exports, validate codes and chapters.",
  reference,
  parse,
  sample: () =>
    [
      "Code,Title,ClassKind,Chapter",
      "1A00,Cholera,Category,01 Certain infectious or parasitic diseases",
      "8A80.0,Epilepsy,Category,08 Diseases of the nervous system",
    ].join("\n") + "\n",
}
