import type { FormatModule, Parsed, ParsedRecord } from "./types.js"
import { readRoot, scanTags, validateXml } from "./_xml.js"

const local = (name: string): string => (name.includes(":") ? name.slice(name.lastIndexOf(":") + 1) : name)

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const root = readRoot(text)
  validateXml(text, root, "EAD document", issues)

  const tags = scanTags(text)
  const records: ParsedRecord[] = []
  let headers = 0
  let archdescs = 0
  let components = 0
  let unittitles = 0
  let level = ""

  for (const tag of tags) {
    if (tag.close) continue
    const name = local(tag.name)
    if (name === "eadheader") {
      headers += 1
      records.push({ id: "header", kind: "header", fields: { line: tag.line } })
      continue
    }
    if (name === "eadid") {
      records.push({ id: "eadid", kind: "identifier", fields: { identifier: tag.attrs.value ?? "", line: tag.line } })
      continue
    }
    if (name === "archdesc") {
      archdescs += 1
      level = tag.attrs.level ?? ""
      if (!level) issues.push({ code: "no-level", severity: "error", message: "archdesc has no level", line: tag.line })
      records.push({ id: "archdesc", kind: "archdesc", fields: { level, line: tag.line } })
      continue
    }
    if (/^c\d{2}$/.test(name)) {
      components += 1
      records.push({ id: `component:${components}`, kind: "component", fields: { level: tag.attrs.level ?? "", line: tag.line } })
      continue
    }
    if (name === "unittitle") unittitles += 1
  }

  if (local(root) !== "ead") {
    issues.push({ code: "bad-root", severity: "error", message: `Root must be ead, found ${root || "nothing"}` })
  }
  if (headers === 0) issues.push({ code: "no-header", severity: "error", message: "Document has no eadheader" })
  if (archdescs === 0) issues.push({ code: "no-archdesc", severity: "error", message: "Document has no archdesc" })
  if (unittitles === 0) issues.push({ code: "no-title", severity: "warning", message: "Document has no unittitle" })

  return {
    format: "EAD",
    records,
    meta: { headers, archdescs, components, unittitles, level },
    issues,
  }
}

const reference = [
  "EAD archival description (XML)",
  "",
  '<ead xmlns="http://ead3.archivists.org/schema/">',
  "  <eadheader><eadid>MS-1</eadid></eadheader>",
  '  <archdesc level="collection">',
  "    <did><unittitle>Papers</unittitle></did>",
  "    <dsc><c01 level=\"series\"><did><unittitle>Correspondence</unittitle></did></c01></dsc>",
  "  </archdesc>",
  "</ead>",
  "",
  "Root is ead.",
  "eadheader and archdesc are required.",
  "archdesc carries a level such as collection or recordgrp.",
].join("\n")

export const format: FormatModule = {
  slug: "ead",
  displayName: "EAD",
  extensions: [".xml", ".ead"],
  description: "Parse EAD finding aids, validate headers, archdesc and components.",
  reference,
  parse,
  sample: () =>
    [
      '<?xml version="1.0"?>',
      '<ead xmlns="http://ead3.archivists.org/schema/">',
      "  <eadheader><eadid>MS-1</eadid></eadheader>",
      '  <archdesc level="collection">',
      "    <did><unittitle>Papers</unittitle></did>",
      '    <dsc><c01 level="series"><did><unittitle>Correspondence</unittitle></did></c01></dsc>',
      "  </archdesc>",
      "</ead>",
    ].join("\n") + "\n",
}
