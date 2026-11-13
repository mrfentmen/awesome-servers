import type { FormatModule, Issue, Parsed, ParsedRecord } from "./types.js"

const MANDATORY: Record<string, string[]> = {
  "103": ["20", "23B", "32A", "59"],
  "202": ["20", "23B", "32A", "58A"],
  "940": ["20", "25", "28C", "34F"],
}

function parse(text: string): Parsed {
  const issues: Issue[] = []
  const records: ParsedRecord[] = []
  const meta: Parsed["meta"] = {}
  const source = text.replace(/\\r/g, "\n")

  if (!source.trim().startsWith("{")) {
    issues.push({ code: "no-blocks", severity: "error", message: "Message must start with a block, for example {1:" })
  }

  const blocks = new Map<string, string>()
  for (const match of source.matchAll(/\{(\d):([\s\S]*?)\}/g)) {
    blocks.set(match[1], match[2])
    records.push({ id: `block-${match[1]}`, kind: "block", fields: { block: match[1], length: match[2].length } })
  }

  for (const required of ["1", "2", "4"]) {
    if (!blocks.has(required)) {
      issues.push({ code: "missing-block", severity: "error", message: `Block {${required}: is required` })
    }
  }

  const block1 = blocks.get("1") ?? ""
  const block2 = blocks.get("2") ?? ""
  const block4 = blocks.get("4") ?? ""

  const application = block1.slice(0, 3)
  const serviceId = block2.slice(0, 3)
  // Block 2 starts with a direction letter (I input, O output) then the three
  // digit message type, for example I103.
  const messageType = block2.slice(1, 4)
  if (application) meta.applicationId = application
  if (serviceId) meta.serviceId = serviceId
  if (messageType) meta.messageType = messageType

  const sender = /^([A-Z]{12})/.exec(block1) ?? /F([A-Z0-9]{12})/.exec(block1)
  if (sender) meta.sender = sender[1]
  const receiver = /I[A-Z0-9]{3}([A-Z0-9]{12})/.exec(block2)
  if (receiver) meta.receiver = receiver[1]

  if (block4 && !block4.trimEnd().endsWith("-")) {
    issues.push({ code: "unterminated-block4", severity: "error", message: "Block 4 must end with -}" })
  }

  const body = block4.replace(/-$/, "").trim()
  const fields: Array<{ tag: string; value: string }> = []
  const fieldPattern = /:(\d{2}[A-Z]?):/g
  const matches = [...body.matchAll(fieldPattern)]
  matches.forEach((match, index) => {
    const tag = match[1]
    const start = (match.index ?? 0) + match[0].length
    const end = index + 1 < matches.length ? matches[index + 1].index ?? body.length : body.length
    const value = body.slice(start, end).trim()
    fields.push({ tag, value })
    records.push({
      id: `field-${tag}-${index + 1}`,
      kind: "field",
      fields: { tag, value, length: value.length },
    })
  })

  if (body.length > 0 && fields.length === 0) {
    issues.push({ code: "no-fields", severity: "error", message: "Block 4 has no :tag: fields" })
  }

  const required = MANDATORY[messageType]
  if (required) {
    for (const tag of required) {
      if (!fields.some((field) => field.tag === tag)) {
        issues.push({
          code: "missing-mandatory-field",
          severity: "error",
          message: `MT${messageType} requires field :${tag}:`,
        })
      }
    }
  }

  if (messageType === "103") {
    const hasOrderingCustomer = fields.some((field) => field.tag === "50K" || field.tag === "50A" || field.tag === "50F")
    if (!hasOrderingCustomer) {
      issues.push({ code: "missing-ordering-customer", severity: "error", message: "MT103 requires an ordering customer field (50K, 50A or 50F)" })
    }
  }

  meta.fields = fields.length
  meta.blocks = blocks.size

  return { format: "SWIFT MT", records, meta, issues }
}

const reference = [
  "SWIFT MT message",
  "",
  "{1:F01BANKBEBAAXXX0000000000}   basic header",
  "{2:I103BANKDEFFXXXXN}           application header, I is input, 103 is the type",
  "{4:                            text block",
  "  :20:REFERENCE",
  "  :23B:CRED",
  "  :32A:260101USD1000,00",
  "  :50K:/12345678",
  "  JOHN DOE",
  "  :59:/87654321",
  "  JANE ROE",
  "-}                              block 4 ends with -}",
  "Field tags are :NN: or :NNA: (two digits plus an optional letter).",
].join("\n")

export const format: FormatModule = {
  slug: "swift-mt",
  displayName: "SWIFT MT",
  extensions: [".mt", ".txt"],
  description: "Parse SWIFT MT blocks and fields, validate mandatory sequences.",
  reference,
  parse,
  regressions: [
    {
      doc: "{1:F01BANKBEBAAXXX0000000000}{2:I103BANKDEFFXXXXN}{4::20:REF-}",
      expectError: "MT103 requires field",
    },
  ],
  sample: () =>
    [
      "{1:F01BANKBEBAAXXX0000000000}",
      "{2:I103BANKDEFFXXXXN}",
      "{4:",
      ":20:REF20260101",
      ":23B:CRED",
      ":32A:260101USD1000,00",
      ":50K:/12345678",
      "JOHN DOE",
      ":59:/87654321",
      "JANE ROE",
      "-}",
    ].join("\n") + "\n",
}
