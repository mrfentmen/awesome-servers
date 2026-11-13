import type { FormatModule, Issue, Parsed, ParsedRecord } from "./types.js"

const SEGMENT_ID = /^[A-Z][A-Z0-9]{2}$/

function segments(text: string): Array<{ raw: string; index: number }> {
  const normalized = text.replace(/\r\n/g, "\r").replace(/\n/g, "\r")
  const out: Array<{ raw: string; index: number }> = []
  for (const raw of normalized.split("\r")) {
    if (raw.trim().length === 0) continue
    out.push({ raw, index: out.length + 1 })
  }
  return out
}

function fieldAt(parts: string[], field: number, isMsh: boolean): string {
  if (isMsh && field === 1) return "|"
  return parts[field] ?? ""
}

function firstComponent(value: string): string {
  return value.split("^")[0] ?? ""
}

function parse(text: string): Parsed {
  const issues: Issue[] = []
  const records: ParsedRecord[] = []
  const rows = segments(text)

  if (rows.length === 0) {
    issues.push({ code: "empty", severity: "error", message: "Document has no HL7 segments" })
    return { format: "HL7 v2", records, meta: {}, issues }
  }

  const meta: Parsed["meta"] = { segmentCount: rows.length }
  let messageType = ""
  let controlId = ""
  let version = ""

  for (const row of rows) {
    const parts = row.raw.split("|")
    const id = parts[0].trim()
    const isMsh = id === "MSH"

    if (!SEGMENT_ID.test(id)) {
      issues.push({
        code: "bad-segment-id",
        severity: "error",
        message: `Segment ${row.index}: id "${id}" is not a 3 character HL7 segment id`,
        line: row.index,
      })
    }

    if (isMsh) {
      const encoding = parts[1] ?? ""
      if (!encoding.startsWith("^")) {
        issues.push({
          code: "bad-encoding",
          severity: "error",
          message: "MSH-2 encoding characters must start with ^",
          line: row.index,
        })
      }
      const type = fieldAt(parts, 9, true)
      messageType = type || messageType
      controlId = fieldAt(parts, 10, true) || controlId
      version = fieldAt(parts, 12, true) || version
      if (!type) {
        issues.push({ code: "missing-msh9", severity: "error", message: "MSH-9 message type is missing", line: row.index })
      }
      if (!fieldAt(parts, 10, true)) {
        issues.push({
          code: "missing-msh10",
          severity: "warning",
          message: "MSH-10 message control id is missing",
          line: row.index,
        })
      }
      if (!fieldAt(parts, 12, true)) {
        issues.push({ code: "missing-msh12", severity: "warning", message: "MSH-12 version id is missing", line: row.index })
      }
    }

    records.push({
      id: `${id}-${row.index}`,
      kind: id,
      fields: {
        segment: id,
        fieldCount: parts.length,
        firstField: isMsh ? (parts[2] ?? "") : (parts[1] ?? ""),
        raw: row.raw,
      },
    })
  }

  if (rows[0].raw.split("|")[0].trim() !== "MSH") {
    issues.push({
      code: "msh-not-first",
      severity: "error",
      message: "The first segment must be MSH",
      line: 1,
    })
  }

  if (messageType) meta.messageType = messageType
  if (controlId) meta.controlId = controlId
  if (version) meta.version = version
  meta.messageCode = firstComponent(messageType)
  meta.triggerEvent = messageType.split("^")[1] ?? ""

  const pid = rows.find((row) => row.raw.startsWith("PID|"))
  if (pid && messageType.startsWith("ADT") === false && messageType.includes("ADT")) {
    meta.hasPatient = true
  } else if (pid) {
    meta.hasPatient = true
  }

  return { format: "HL7 v2", records, meta, issues }
}

const reference = [
  "HL7 v2 message structure",
  "",
  "Segments are separated by carriage returns. Fields are separated by |.",
  "Components use ^, repetitions use ~, escapes use \\, subcomponents use &.",
  "MSH-1 is the field separator itself, so MSH-2 is the first literal field.",
  "",
  "Common segments:",
  "  MSH  message header (always first)",
  "  PID  patient identification",
  "  PV1  patient visit",
  "  OBR  observation request",
  "  OBX  observation result",
  "  ORC  common order",
  "",
  "MSH-9 message type, for example ADT^A01. MSH-10 control id must be unique per sender.",
  "MSH-12 version id, for example 2.5.1.",
].join("\n")

export const format: FormatModule = {
  slug: "hl7-v2",
  displayName: "HL7 v2",
  extensions: [".hl7", ".hl7v2", ".msg"],
  description: "Parse HL7 v2 messages, validate the MSH header and extract segments.",
  reference,
  parse,
  sample: () =>
    [
      "MSH|^~\\&|SENDAPP|SENDFAC|RECVAPP|RECVFAC|20260101120000||ADT^A01^ADT_A01|MSG00001|P|2.5",
      "PID|1||123456^^^MRN||Doe^John||19800101|M",
      "PV1|1|I|WARD^101^A",
    ].join("\r") + "\r",
}
