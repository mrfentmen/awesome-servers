import type { FormatModule, Parsed, ParsedRecord } from "./types.js"
import { readRoot, scanTags, validateXml } from "./_xml.js"

const local = (name: string): string => (name.includes(":") ? name.slice(name.lastIndexOf(":") + 1) : name)

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const root = readRoot(text)
  validateXml(text, root, "GDSN message", issues)

  const tags = scanTags(text)
  const records: ParsedRecord[] = []
  const gtins = new Set<string>()
  let items = 0
  let providers = 0
  let markets = 0

  for (const tag of tags) {
    if (tag.close) continue
    const name = local(tag.name)
    if (name === "itemData") {
      items += 1
      records.push({ id: `item:${items}`, kind: "item", fields: { line: tag.line } })
      continue
    }
    if (name === "informationProvider" || name === "partyData") {
      providers += 1
      records.push({ id: `provider:${providers}`, kind: "provider", fields: { line: tag.line } })
      continue
    }
    if (name === "targetMarket") {
      markets += 1
      records.push({ id: `market:${markets}`, kind: "market", fields: { country: tag.attrs.countryCode ?? "", line: tag.line } })
      continue
    }
    if (name === "gtin") {
      const value = tag.attrs.value ?? ""
      records.push({ id: `gtin:${records.length}`, kind: "gtin", fields: { gtin: value, line: tag.line } })
      if (value) {
        if (!/^\d{14}$/.test(value)) {
          issues.push({ code: "bad-gtin", severity: "error", message: `GTIN must be 14 digits: ${value}`, line: tag.line })
        }
        gtins.add(value)
      }
    }
  }

  const rootName = local(root)
  if (!/Notification$/.test(rootName) && rootName !== "GDSN") {
    issues.push({ code: "bad-root", severity: "error", message: `Root must be a GDSN notification, found ${rootName || "nothing"}` })
  }
  if (items === 0) issues.push({ code: "no-items", severity: "error", message: "Message has no itemData" })
  if (providers === 0) issues.push({ code: "no-provider", severity: "warning", message: "Message has no informationProvider" })

  return {
    format: "GDSN",
    records,
    meta: { root: rootName, items, providers, markets, gtins: gtins.size },
    issues,
  }
}

const reference = [
  "GS1 GDSN product data notification (XML)",
  "",
  '<itemDataNotification xmlns="urn:gs1:gdsn:item_data_notification:xsd:3">',
  "  <itemData>",
  "    <gtin>00012345600012</gtin>",
  "  </itemData>",
  "  <informationProvider><gln>1234567890123</gln></informationProvider>",
  "</itemDataNotification>",
  "",
  "Root is a GDSN notification such as itemDataNotification.",
  "Each itemData carries a GTIN.",
  "GTIN values are 14 digits.",
].join("\n")

export const format: FormatModule = {
  slug: "gs1-gdsn",
  displayName: "GS1 GDSN",
  extensions: [".xml"],
  description: "Parse GDSN notifications, validate items, GTINs and providers.",
  reference,
  parse,
  sample: () =>
    [
      '<?xml version="1.0"?>',
      '<itemDataNotification xmlns="urn:gs1:gdsn:item_data_notification:xsd:3">',
      "  <itemData>",
      "    <gtin>00012345600012</gtin>",
      "  </itemData>",
      "  <informationProvider><gln>1234567890123</gln></informationProvider>",
      "</itemDataNotification>",
    ].join("\n") + "\n",
}
