import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const blocks = [...text.matchAll(/\{(\d):([\s\S]*?)\}/g)].map((match) => ({ id: match[1], body: match[2] }))
  const blockIds = blocks.map((block) => block.id)
  const block2 = blocks.find((block) => block.id === "2")?.body ?? ""
  const messageType = /[IO](\d{3})/.exec(block2)?.[1] ?? ""
  const block4 = blocks.find((block) => block.id === "4")?.body ?? ""

  let opens = 0
  let closes = 0
  let sequences = 0
  let events = 0
  let holdings = 0
  const tags = new Map<string, number>()

  for (const raw of block4.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line.startsWith(":")) continue
    const match = /^:(\d{2}[A-Z]?):(.*)$/.exec(line)
    if (!match) {
      issues.push({ code: "bad-tag", severity: "error", message: `Malformed tag line: ${line.slice(0, 24)}` })
      continue
    }
    const tag = match[1]
    const value = match[2]
    tags.set(tag, (tags.get(tag) ?? 0) + 1)
    if (tag === "16R") {
      opens += 1
      sequences += 1
    } else if (tag === "16S") {
      closes += 1
      if (closes > opens) issues.push({ code: "unbalanced", severity: "error", message: "16S appears before any 16R" })
    } else if (tag === "35B") {
      holdings += 1
    } else if (tag === "22F" && /:CAEV\//.test(value)) {
      events += 1
    } else if (tag === "20C" && /:CORP\//.test(value)) {
      events += 1
    }
  }

  if (!blockIds.includes("1")) issues.push({ code: "no-block-1", severity: "error", message: "Message has no block 1" })
  if (!blockIds.includes("2")) issues.push({ code: "no-block-2", severity: "error", message: "Message has no block 2" })
  if (!block4) issues.push({ code: "no-block-4", severity: "error", message: "Message has no block 4" })
  if (block4 && !block4.trimEnd().endsWith("-")) issues.push({ code: "no-end", severity: "error", message: "Block 4 must end with -" })
  if (messageType !== "564") issues.push({ code: "wrong-type", severity: "error", message: `Expected message type 564, found ${messageType || "nothing"}` })
  if (opens !== closes) issues.push({ code: "unbalanced", severity: "error", message: `${opens} 16R tag(s) but ${closes} 16S tag(s)` })
  if (events === 0) issues.push({ code: "no-corporate-action", severity: "error", message: "Message has no :20C::CORP or :22F::CAEV" })

  for (const [index, block] of blocks.entries()) {
    records.push({ id: `block:${index + 1}`, kind: `block${block.id}`, fields: { id: block.id, length: block.body.length } })
  }

  return {
    format: "MT564",
    records,
    meta: { messageType, sequences, events, holdings, tags: tags.size },
    issues,
  }
}

const reference = [
  "SWIFT MT564 corporate action notification",
  "",
  "{1:F01BANKBEBBAXXX0000000000}{2:O5641200261113BANKBEBBAXXX00000000002611131200N}{4:",
  ":16R:GENL",
  ":20C::CORP//CA123",
  ":22F::CAEV//DVCA",
  ":16S:GENL",
  ":16R:USECU",
  ":35B:ISIN BE0000000001",
  ":16S:USECU",
  "-}",
  "",
  "Block 2 carries the message type; MT564 is a corporate action.",
  ":20C::CORP or :22F::CAEV identifies the event.",
  "16R and 16S must balance.",
].join("\n")

export const format: FormatModule = {
  slug: "mt564",
  displayName: "MT564",
  extensions: [".564", ".mt564"],
  description: "Parse MT564 corporate actions, validate blocks, sequences and event tags.",
  reference,
  parse,
  sample: () =>
    [
      "{1:F01BANKBEBBAXXX0000000000}{2:O5641200261113BANKBEBBAXXX00000000002611131200N}{4:",
      ":16R:GENL",
      ":20C::CORP//CA123",
      ":22F::CAEV//DVCA",
      ":16S:GENL",
      ":16R:USECU",
      ":35B:ISIN BE0000000001",
      ":16S:USECU",
      "-}",
    ].join("\n") + "\n",
}
