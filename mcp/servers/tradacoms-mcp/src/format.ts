import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const segments = text
    .split("'")
    .map((segment) => segment.replace(/\r?\n/g, "").trim())
    .filter((segment) => segment.length > 0)

  if (segments.length === 0) {
    return { format: "Tradacoms", records, meta: { segments: 0 }, issues: [{ code: "empty", severity: "error", message: "File has no segments" }] }
  }

  const tags = segments.map((segment) => segment.split("=")[0].trim().toUpperCase())
  const first = segments[0]
  const last = segments[segments.length - 1]

  if (!/^STX=/.test(first)) {
    issues.push({ code: "no-stx", severity: "error", message: "File must start with STX=" })
  }
  if (!/^END=/.test(last)) {
    issues.push({ code: "no-end", severity: "error", message: "File must end with END=" })
  }

  for (const [index, segment] of segments.entries()) {
    if (segment.length > 2000) {
      issues.push({ code: "long-segment", severity: "warning", message: "Segment is longer than 2000 characters", line: index + 1 })
    }
    records.push({ id: `segment:${index + 1}`, kind: tags[index] || "unknown", fields: { tag: tags[index] ?? "", line: index + 1 } })
  }

  const declared = Number(/^END=(\d+)/.exec(last)?.[1])
  if (Number.isInteger(declared) && declared !== segments.length) {
    issues.push({ code: "bad-count", severity: "error", message: `END says ${declared} segments, file has ${segments.length}` })
  }
  if (!tags.includes("MHD")) issues.push({ code: "no-mhd", severity: "error", message: "File has no MHD message header segment" })
  if (!tags.includes("END")) issues.push({ code: "no-end", severity: "error", message: "File has no END segment" })

  return {
    format: "Tradacoms",
    records,
    meta: { segments: segments.length, messages: tags.filter((tag) => tag === "MHD").length, declared: Number.isFinite(declared) ? declared : 0 },
    issues,
  }
}

const reference = [
  "Tradacoms EDI interchange",
  "",
  "STX=ANAA:1+SUPPLIER:1+RETAILER:1+261112:1200+00001'",
  "MHD=1+ORDERS:1'",
  "TYP=0430:9'",
  "SDT=SUPPLIER'",
  "END=5'",
  "",
  "Segments end with an apostrophe.",
  "STX opens the interchange; END closes it.",
  "END carries the segment count.",
].join("\n")

export const format: FormatModule = {
  slug: "tradacoms",
  displayName: "Tradacoms",
  extensions: [".txt", ".edi"],
  description: "Parse Tradacoms interchanges, validate STX, END and segment counts.",
  reference,
  parse,
  sample: () =>
    [
      "STX=ANAA:1+SUPPLIER:1+RETAILER:1+261112:1200+00001'",
      "MHD=1+ORDERS:1'",
      "TYP=0430:9'",
      "SDT=SUPPLIER'",
      "END=5'",
    ].join("\n") + "\n",
}
