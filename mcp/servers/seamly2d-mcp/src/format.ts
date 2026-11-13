import type { FormatModule, Parsed, ParsedRecord } from "./types.js"
import { scanTags, validateXml } from "./_xml.js"

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  validateXml(text, "pattern", "Seamly2D pattern", issues)

  const tags = scanTags(text)
  const records: ParsedRecord[] = []
  const pieces = new Set<string>()
  const blocks = new Set<string>()
  let measurements = 0

  for (const tag of tags) {
    if (tag.close) continue
    if (tag.name === "piece") {
      const name = tag.attrs.name ?? ""
      if (!name) {
        issues.push({ code: "piece-without-name", severity: "error", message: "piece has no name", line: tag.line })
      } else if (pieces.has(name)) {
        issues.push({ code: "duplicate-piece", severity: "error", message: `Piece ${name} appears twice`, line: tag.line })
      }
      pieces.add(name)
      records.push({ id: `piece:${name || tag.line}`, kind: "piece", fields: { name, line: tag.line } })
      continue
    }
    if (tag.name === "draftBlock") {
      const name = tag.attrs.name ?? ""
      if (!name) issues.push({ code: "block-without-name", severity: "error", message: "draftBlock has no name", line: tag.line })
      blocks.add(name)
      records.push({ id: `block:${name || tag.line}`, kind: "block", fields: { name, line: tag.line } })
      continue
    }
    if (tag.name === "increment" || tag.name === "measurement") {
      measurements += 1
      const value = Number(tag.attrs.value)
      if (tag.attrs.value !== undefined && !Number.isFinite(value)) {
        issues.push({ code: "bad-value", severity: "error", message: `${tag.name} ${tag.attrs.name ?? ""} value is not numeric: ${tag.attrs.value}`, line: tag.line })
      }
      records.push({ id: `${tag.name}:${tag.attrs.name ?? measurements}`, kind: tag.name, fields: { name: tag.attrs.name ?? "", value: tag.attrs.value ?? "", line: tag.line } })
    }
  }

  if (pieces.size === 0) issues.push({ code: "no-pieces", severity: "warning", message: "Pattern has no piece" })
  if (blocks.size === 0) issues.push({ code: "no-blocks", severity: "warning", message: "Pattern has no draftBlock" })

  const unit = tags.find((tag) => tag.name === "unit")?.attrs?.name ?? ""

  return {
    format: "Seamly2D",
    records,
    meta: { pieces: pieces.size, blocks: blocks.size, measurements, unit },
    issues,
  }
}

const reference = [
  "Seamly2D pattern (.val, XML)",
  "",
  "<pattern>",
  "  <unit name=\"cm\"/>",
  "  <calculation>",
  "    <increment name=\"height\" value=\"170\"/>",
  "  </calculation>",
  "  <draftBlock name=\"bodice\"/>",
  "  <pieces>",
  "    <piece name=\"front\"/>",
  "    <piece name=\"back\"/>",
  "  </pieces>",
  "</pattern>",
  "",
  "The root element is pattern.",
  "Pieces need unique names; draftBlock names the drafting block.",
  "Increments and measurements carry a numeric value.",
].join("\n")

export const format: FormatModule = {
  slug: "seamly2d",
  displayName: "Seamly2D",
  extensions: [".val"],
  description: "Parse Seamly2D patterns, validate pieces, blocks and measurements.",
  reference,
  parse,
  sample: () =>
    [
      '<?xml version="1.0"?>',
      "<pattern>",
      '  <unit name="cm"/>',
      "  <calculation>",
      '    <increment name="height" value="170"/>',
      "  </calculation>",
      '  <draftBlock name="bodice"/>',
      "  <pieces>",
      '    <piece name="front"/>',
      '    <piece name="back"/>',
      "  </pieces>",
      "</pattern>",
    ].join("\n") + "\n",
}
