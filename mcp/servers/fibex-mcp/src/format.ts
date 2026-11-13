import type { FormatModule, Parsed, ParsedRecord } from "./types.js"
import { readRoot, scanTags, validateXml } from "./_xml.js"

const local = (name: string): string => (name.includes(":") ? name.slice(name.lastIndexOf(":") + 1) : name)

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const root = readRoot(text)
  validateXml(text, root, "FIBEX file", issues)

  const tags = scanTags(text)
  const records: ParsedRecord[] = []
  const ids = new Set<string>()
  const counts = { channels: 0, frames: 0, pdus: 0, signals: 0, ecus: 0 }

  for (const tag of tags) {
    if (tag.close) continue
    const name = local(tag.name)
    const bucket =
      name === "CHANNEL" ? "channels" :
      name === "FRAME" ? "frames" :
      name === "PDU" ? "pdus" :
      name === "SIGNAL" ? "signals" :
      name === "ECU" ? "ecus" : ""
    if (!bucket) continue
    counts[bucket] += 1
    const id = tag.attrs.ID ?? ""
    if (id) {
      if (ids.has(id)) issues.push({ code: "duplicate-id", severity: "error", message: `ID ${id} appears twice`, line: tag.line })
      ids.add(id)
    }
    records.push({ id: `${bucket}:${id || counts[bucket]}`, kind: name, fields: { id, line: tag.line } })
  }

  const rootName = local(root)
  if (rootName !== "FIBEX") {
    issues.push({ code: "bad-root", severity: "error", message: `Root must be FIBEX, found ${rootName || "nothing"}` })
  }
  if (counts.channels === 0) issues.push({ code: "no-channels", severity: "error", message: "File has no CHANNEL" })
  if (counts.frames === 0) issues.push({ code: "no-frames", severity: "error", message: "File has no FRAME" })
  if (counts.signals === 0) issues.push({ code: "no-signals", severity: "warning", message: "File has no SIGNAL" })

  return {
    format: "FIBEX",
    records,
    meta: { root: rootName, ...counts },
    issues,
  }
}

const reference = [
  "ASAM FIBEX network description",
  "",
  '<FIBEX xmlns="http://www.asam.net/xml/fbx" VERSION="4.1">',
  '  <CHANNELS><CHANNEL ID="ch1"><SHORT-NAME>CAN</SHORT-NAME></CHANNEL></CHANNELS>',
  '  <FRAMES><FRAME ID="fr1"><SHORT-NAME>Status</SHORT-NAME></FRAME></FRAMES>',
  '  <PDUS><PDU ID="p1"><SHORT-NAME>P1</SHORT-NAME></PDU></PDUS>',
  '  <SIGNALS><SIGNAL ID="sg1"><SHORT-NAME>Speed</SHORT-NAME></SIGNAL></SIGNALS>',
  "</FIBEX>",
  "",
  "Root is FIBEX.",
  "Channels carry frames, frames carry PDUs, PDUs carry signals.",
  "Every object needs a unique ID.",
].join("\n")

export const format: FormatModule = {
  slug: "fibex",
  displayName: "FIBEX",
  extensions: [".fibex"],
  description: "Parse ASAM FIBEX files, validate channels, frames, PDUs and signals.",
  reference,
  parse,
  sample: () =>
    [
      '<?xml version="1.0"?>',
      '<FIBEX xmlns="http://www.asam.net/xml/fbx" VERSION="4.1">',
      '  <CHANNELS><CHANNEL ID="ch1"><SHORT-NAME>CAN</SHORT-NAME></CHANNEL></CHANNELS>',
      '  <FRAMES><FRAME ID="fr1"><SHORT-NAME>Status</SHORT-NAME></FRAME></FRAMES>',
      '  <PDUS><PDU ID="p1"><SHORT-NAME>P1</SHORT-NAME></PDU></PDUS>',
      '  <SIGNALS><SIGNAL ID="sg1"><SHORT-NAME>Speed</SHORT-NAME></SIGNAL></SIGNALS>',
      "</FIBEX>",
    ].join("\n") + "\n",
}
