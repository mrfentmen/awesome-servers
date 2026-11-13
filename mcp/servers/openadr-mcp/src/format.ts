import type { FormatModule, Parsed, ParsedRecord } from "./types.js"
import { readRoot, scanTags, validateXml } from "./_xml.js"

const local = (name: string): string => (name.includes(":") ? name.slice(name.lastIndexOf(":") + 1) : name)

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const root = readRoot(text)
  validateXml(text, root, "OpenADR message", issues)

  const tags = scanTags(text)
  const records: ParsedRecord[] = []
  const eventIds = new Set<string>()
  let events = 0
  let signals = 0
  let venId = ""

  for (const tag of tags) {
    if (tag.close) continue
    const name = local(tag.name)
    if (name === "venID") {
      venId = tag.attrs.value ?? ""
      records.push({ id: "ven", kind: "ven", fields: { venId, line: tag.line } })
      continue
    }
    if (name === "oadrEvent" || (name === "eiEvent" && events === 0)) {
      events += 1
      const id = tag.attrs.eventID ?? tag.attrs.id ?? ""
      if (id) eventIds.add(id)
      records.push({ id: `event:${events}`, kind: "event", fields: { eventId: id, line: tag.line } })
      continue
    }
    if (name === "eventID") {
      const value = tag.attrs.value ?? ""
      if (value) eventIds.add(value)
      continue
    }
    if (name === "oadrSignal" || name === "eiSignal") {
      signals += 1
      records.push({ id: `signal:${signals}`, kind: "signal", fields: { line: tag.line } })
    }
  }

  if (local(root) !== "oadrPayload") {
    issues.push({ code: "bad-root", severity: "error", message: `Root must be oadrPayload, found ${root || "nothing"}` })
  }
  if (events === 0) issues.push({ code: "no-events", severity: "error", message: "Payload has no oadrEvent" })
  if (!venId) issues.push({ code: "no-ven", severity: "warning", message: "Payload has no venID" })

  return {
    format: "OpenADR",
    records,
    meta: { root: local(root), events, signals, venId },
    issues,
  }
}

const reference = [
  "OpenADR 2.0b payload (XML)",
  "",
  '<oadrPayload xmlns="http://openadr.org/oadr-2.0b/2012/07">',
  "  <oadrSignedObject>",
  "    <oadrDistributeEvent>",
  "      <oadrEvent>",
  "        <eiEvent><eventDescriptor><eventID>ev1</eventID></eventDescriptor></eiEvent>",
  "      </oadrEvent>",
  "    </oadrDistributeEvent>",
  "  </oadrSignedObject>",
  "  <venID>VEN1</venID>",
  "</oadrPayload>",
  "",
  "Root is oadrPayload.",
  "Events arrive in oadrEvent inside oadrDistributeEvent.",
  "venID identifies the receiving client.",
].join("\n")

export const format: FormatModule = {
  slug: "openadr",
  displayName: "OpenADR",
  extensions: [".xml"],
  description: "Parse OpenADR payloads, validate events, signals and venID.",
  reference,
  parse,
  sample: () =>
    [
      '<?xml version="1.0"?>',
      '<oadrPayload xmlns="http://openadr.org/oadr-2.0b/2012/07">',
      "  <oadrSignedObject>",
      "    <oadrDistributeEvent>",
      "      <oadrEvent>",
      "        <eiEvent><eventDescriptor><eventID>ev1</eventID></eventDescriptor></eiEvent>",
      "      </oadrEvent>",
      "    </oadrDistributeEvent>",
      "  </oadrSignedObject>",
      "  <venID>VEN1</venID>",
      "</oadrPayload>",
    ].join("\n") + "\n",
}
