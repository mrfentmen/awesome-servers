import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const fields = new Map<string, number>()
  const keys: Array<{ field: string; line: number }> = []

  text.split(/\r?\n/).forEach((raw, index) => {
    const number = index + 1
    if (raw.trim().length === 0) return
    const line = raw.trimEnd()

    if (/^\s*A\s+/.test(line)) {
      const field = /^\s*A\s+([A-Za-z_]\w*)\s+(\d+)([A-Z])?\s*(\d+)?/.exec(line)
      if (!field) {
        issues.push({ code: "bad-field", severity: "error", message: `Field line needs name, length and type: ${line.trim().slice(0, 40)}`, line: number })
        return
      }
      const name = field[1]
      const length = Number(field[2])
      const type = field[3] ?? "A"
      const decimals = field[4] ? Number(field[4]) : 0
      if (length <= 0) {
        issues.push({ code: "bad-length", severity: "error", message: `Field ${name} length must be positive`, line: number })
      }
      if ((type === "P" || type === "S") && decimals > length) {
        issues.push({ code: "bad-decimals", severity: "error", message: `Field ${name} has more decimals than digits`, line: number })
      }
      if (fields.has(name)) {
        issues.push({ code: "duplicate-field", severity: "error", message: `Field ${name} is defined twice`, line: number })
      }
      fields.set(name, number)
      records.push({ id: `field:${name}`, kind: "field", fields: { name, length, type, decimals, line: number } })
      return
    }

    if (/^\s*K\s+/.test(line)) {
      const key = /^\s*K\s+([A-Za-z_]\w*)/.exec(line)
      if (!key) {
        issues.push({ code: "bad-key", severity: "error", message: "Key line needs a field name", line: number })
        return
      }
      keys.push({ field: key[1], line: number })
      records.push({ id: `key:${key[1]}`, kind: "key", fields: { field: key[1], line: number } })
      return
    }

    issues.push({ code: "unknown-spec", severity: "warning", message: `Unknown DDS line: ${line.trim().slice(0, 40)}`, line: number })
  })

  for (const key of keys) {
    if (!fields.has(key.field)) {
      issues.push({ code: "unknown-key-field", severity: "error", message: `Key field ${key.field} is not defined`, line: key.line })
    }
  }
  if (fields.size === 0) {
    issues.push({ code: "no-fields", severity: "error", message: "Specification defines no fields" })
  }
  if (keys.length === 0) {
    issues.push({ code: "no-keys", severity: "warning", message: "Specification defines no key" })
  }

  return {
    format: "JD Edwards DDS",
    records,
    meta: {
      fields: fields.size,
      keys: keys.length,
      totalBytes: records.reduce((sum, record) => sum + (typeof record.fields.length === "number" ? record.fields.length : 0), 0),
    },
    issues,
  }
}

const reference = [
  "JD Edwards World data definition specification",
  "",
  "     A          EMPID          5S 0",
  "     A          NAME          30A",
  "     K          EMPID",
  "",
  "A marks a field: name, length, type and optional decimals.",
  "Types: A alphanumeric, S signed, P packed, N numeric.",
  "K marks a key over a field defined above.",
  "Columns are fixed width in real files; whitespace is accepted here.",
].join("\n")

export const format: FormatModule = {
  slug: "jd-edwards",
  displayName: "JD Edwards DDS",
  extensions: [".dds"],
  description: "Parse JD Edwards World DDS specs, validate fields, types and keys.",
  reference,
  parse,
  sample: () =>
    [
      "     A          EMPID          5S 0",
      "     A          NAME          30A",
      "     K          EMPID",
    ].join("\n") + "\n",
}
