import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

const SEGMENT = "\u001c"
const FIELD = "\u001d"
const GROUP = "\u001e"

const REQUIRED: Record<string, number> = {
  AM: 5,
  EM: 3,
  HI: 2,
}

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const source = text.replace(/\\x1c/gi, SEGMENT).replace(/\\x1d/gi, FIELD).replace(/\\x1e/gi, GROUP)

  const segments = source.split(SEGMENT).map((segment) => segment.trim()).filter((segment) => segment.length > 0)
  if (segments.length === 0) {
    issues.push({ code: "empty", severity: "error", message: "Document has no segments" })
    return { format: "NCPDP Telecom", records, meta: {}, issues }
  }

  const ids: string[] = []
  segments.forEach((segment, index) => {
    const number = index + 1
    const fields = segment.split(FIELD)
    const id = (fields[0] ?? "").slice(0, 2).toUpperCase()
    if (!/^[A-Z]{2}$/.test(id)) {
      issues.push({ code: "bad-segment-id", severity: "error", message: `Segment ${number} has no 2 letter id: ${fields[0] ?? ""}`, line: number })
      return
    }
    ids.push(id)
    const payload = [fields[0].slice(2), ...fields.slice(1)].filter((value) => value.length > 0)
    const required = REQUIRED[id]
    if (required !== undefined && payload.length < required) {
      issues.push({
        code: "short-segment",
        severity: "error",
        message: `Segment ${id} has ${payload.length} field(s), expected at least ${required}`,
        line: number,
      })
    }
    records.push({ id: `${id}-${number}`, kind: id, fields: { segment: id, fields: payload.length, first: payload[0] ?? "", line: number } })
  })

  if (ids[0] !== "AM") {
    issues.push({ code: "missing-header", severity: "error", message: `First segment must be AM (BIN), found ${ids[0] ?? "nothing"}`, line: 1 })
  }
  if (!ids.includes("EM")) {
    issues.push({ code: "missing-em", severity: "error", message: "Transaction has no EM (patient) segment" })
  }
  const bin = records.find((record) => record.kind === "AM")?.fields.first ?? ""
  if (typeof bin === "string" && bin.length > 0 && !/^\d{6,8}$/.test(bin)) {
    issues.push({ code: "bad-bin", severity: "warning", message: `BIN should be 6 to 8 digits, got ${bin}` })
  }
  const groups = source.split(GROUP).length - 1
  if (groups > 0) {
    issues.push({ code: "group-separators", severity: "warning", message: `Found ${groups} group separator(s); they are optional` })
  }

  return {
    format: "NCPDP Telecom",
    records,
    meta: {
      segments: records.length,
      transaction: ids[0] ?? "",
      bin,
      hasPatient: ids.includes("EM"),
      hasInsurance: ids.includes("HI"),
    },
    issues,
  }
}

const reference = [
  "NCPDP Telecom D.0",
  "",
  "Segments are separated by 0x1C, fields by 0x1D, groups by 0x1E.",
  "A segment starts with a 2 letter id then its fields:",
  "  AM  transaction header: BIN, version, transaction code, ...",
  "  EM  patient",
  "  HI  insurance",
  "  TT  totals",
  "",
  "The first segment must be AM.",
  "EM is required for a claim.",
  "Escaped forms \\x1c and \\x1d are also accepted.",
].join("\n")

export const format: FormatModule = {
  slug: "ncpdp",
  displayName: "NCPDP Telecom",
  extensions: [".ncpdp", ".dat"],
  description: "Parse NCPDP Telecom segments, validate header and patient fields.",
  reference,
  parse,
  sample: () =>
    [
      `AM20${FIELD}1234567${FIELD}D0${FIELD}B1${FIELD}1`,
      `EM01${FIELD}DOE${FIELD}JOHN`,
      `HI01${FIELD}ABC123`,
      "",
    ].join(SEGMENT),
}
