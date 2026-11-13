import type { FormatModule, Parsed, ParsedRecord } from "./types.js"
import { readRoot, scanTags, validateXml } from "./_xml.js"

const local = (name: string): string => (name.includes(":") ? name.slice(name.lastIndexOf(":") + 1) : name)
const ROOTS = new Set([
  "DeviceCapability",
  "EndDevice",
  "DER",
  "FlowReservationRequest",
  "FlowReservationResponse",
  "MirrorUsagePoint",
  "Subscription",
])

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const root = readRoot(text)
  validateXml(text, root, "IEEE 2030.5 document", issues)

  const tags = scanTags(text)
  const records: ParsedRecord[] = []
  let resources = 0
  let withHref = 0
  let pollRates = 0

  for (const tag of tags) {
    if (tag.close) continue
    const name = local(tag.name)
    if (!ROOTS.has(name) && name !== "DERCapability" && name !== "DERStatus") continue
    resources += 1
    const href = tag.attrs.href ?? ""
    if (href) withHref += 1
    else issues.push({ code: "missing-href", severity: "error", message: `${name} has no href`, line: tag.line })
    if (tag.attrs.pollRate !== undefined) {
      pollRates += 1
      if (!/^\d+$/.test(tag.attrs.pollRate)) {
        issues.push({ code: "bad-poll-rate", severity: "error", message: `pollRate must be an integer: ${tag.attrs.pollRate}`, line: tag.line })
      }
    }
    records.push({ id: `${name}:${resources}`, kind: name, fields: { href, line: tag.line } })
  }

  const rootName = local(root)
  if (!ROOTS.has(rootName)) {
    issues.push({ code: "bad-root", severity: "error", message: `Root must be an IEEE 2030.5 resource, found ${rootName || "nothing"}` })
  }
  if (resources === 0) issues.push({ code: "no-resources", severity: "error", message: "Document has no resource element" })

  return {
    format: "IEEE 2030.5",
    records,
    meta: { root: rootName, resources, withHref, pollRates },
    issues,
  }
}

const reference = [
  "IEEE 2030.5 smart energy resource (XML)",
  "",
  '<DeviceCapability xmlns="urn:ieee:std:2030.5:ns" href="/dcap">',
  '  <EndDevice href="/ed1"/>',
  '  <MirrorUsagePoint href="/mup1" pollRate="300"/>',
  "</DeviceCapability>",
  "",
  "Root is a resource such as DeviceCapability or EndDevice.",
  "Every resource has an href.",
  "pollRate, when present, is a whole number of seconds.",
].join("\n")

export const format: FormatModule = {
  slug: "ieee2030-5",
  displayName: "IEEE 2030.5",
  extensions: [".xml"],
  description: "Parse IEEE 2030.5 resources, validate hrefs and poll rates.",
  reference,
  parse,
  sample: () =>
    [
      '<?xml version="1.0"?>',
      '<DeviceCapability xmlns="urn:ieee:std:2030.5:ns" href="/dcap">',
      '  <EndDevice href="/ed1"/>',
      '  <MirrorUsagePoint href="/mup1" pollRate="300"/>',
      "</DeviceCapability>",
    ].join("\n") + "\n",
}
