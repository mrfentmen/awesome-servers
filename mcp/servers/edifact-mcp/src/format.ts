import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const body = text.replace(/^\s*UNA[^\n]*\n?/, "")
  const segments = body
    .split("'")
    .map((segment) => segment.replace(/\r?\n/g, "").trim())
    .filter((segment) => segment.length > 0)

  if (segments.length === 0) {
    return { format: "EDIFACT", records, meta: { segments: 0 }, issues: [{ code: "empty", severity: "error", message: "File has no segments" }] }
  }

  const tags = segments.map((segment) => segment.split("+")[0].trim().toUpperCase())
  const required = ["UNB", "UNH", "UNT", "UNZ"]
  for (const tag of required) {
    if (!tags.includes(tag)) {
      issues.push({ code: `missing-${tag.toLowerCase()}`, severity: "error", message: `Interchange has no ${tag} segment` })
    }
  }
  if (tags[0] !== "UNB") {
    issues.push({ code: "bad-start", severity: "error", message: `First segment must be UNB, found ${tags[0] ?? "nothing"}` })
  }

  const unhIndex = tags.indexOf("UNH")
  const untIndex = tags.lastIndexOf("UNT")
  if (unhIndex >= 0 && untIndex >= 0) {
    const unt = segments[untIndex].split("+")
    const declared = Number(unt[1])
    const actual = untIndex - unhIndex + 1
    if (Number.isInteger(declared) && declared !== actual) {
      issues.push({ code: "bad-unt-count", severity: "error", message: `UNT says ${declared} segments, UNH..UNT has ${actual}` })
    }
    const messageRef = unhIndex >= 0 ? segments[unhIndex].split("+")[1]?.split(":")[0] ?? "" : ""
    if (messageRef && unt[2] && unt[2] !== messageRef) {
      issues.push({ code: "unt-ref-mismatch", severity: "error", message: `UNT references ${unt[2]}, UNH says ${messageRef}` })
    }
  }

  const unz = tags.includes("UNZ") ? segments[tags.lastIndexOf("UNZ")].split("+") : []
  if (unz.length > 1 && Number(unz[1]) !== 1) {
    issues.push({ code: "bad-unz", severity: "warning", message: `UNZ counts ${unz[1]} messages` })
  }

  for (const [index, segment] of segments.entries()) {
    const fields = segment.split("+")
    const tag = fields[0].toUpperCase()
    if (!/^[A-Z]{3}$/.test(tag)) {
      issues.push({ code: "bad-segment-tag", severity: "error", message: `Segment tag must be 3 letters: ${tag || "(empty)"}`, line: index + 1 })
    }
    records.push({ id: `segment:${index + 1}`, kind: tag, fields: { tag, elements: fields.length - 1, line: index + 1 } })
  }

  const messages = records.filter((record) => record.kind === "UNH").length

  return {
    format: "EDIFACT",
    records,
    meta: { segments: segments.length, messages, messageType: unhIndex >= 0 ? (segments[unhIndex].split("+")[2] ?? "") : "" },
    issues,
  }
}

const reference = [
  "UN/EDIFACT interchange",
  "",
  "UNA:+.? '",
  "UNB+UNOC:3+SENDER+RECEIVER+261112:1200+1'",
  "UNH+1+ORDERS:D:96A:UN'",
  "BGM+220+ORDER1+9'",
  "DTM+137:20261112:102'",
  "UNT+4+1'",
  "UNZ+1+1'",
  "",
  "UNA declares the delimiters; segments end with '.",
  "UNB opens the interchange and UNZ closes it.",
  "UNT counts the segments from UNH to UNT inclusive.",
].join("\n")

export const format: FormatModule = {
  slug: "edifact",
  displayName: "EDIFACT",
  extensions: [".edi", ".edifact"],
  description: "Parse EDIFACT messages, validate UNB/UNH/UNT counts and segment tags.",
  reference,
  parse,
  sample: () =>
    [
      "UNA:+.? '",
      "UNB+UNOC:3+SENDER+RECEIVER+261112:1200+1'",
      "UNH+1+ORDERS:D:96A:UN'",
      "BGM+220+ORDER1+9'",
      "DTM+137:20261112:102'",
      "UNT+4+1'",
      "UNZ+1+1'",
    ].join("\n") + "\n",
}
