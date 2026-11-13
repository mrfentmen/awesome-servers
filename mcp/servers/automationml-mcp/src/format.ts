import type { FormatModule, Parsed, ParsedRecord } from "./types.js"
import { readRoot, scanTags, validateXml } from "./_xml.js"

const local = (name: string): string => (name.includes(":") ? name.slice(name.lastIndexOf(":") + 1) : name)

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const root = readRoot(text)
  validateXml(text, root, "AutomationML CAEX file", issues)

  const tags = scanTags(text)
  const records: ParsedRecord[] = []
  const ids = new Set<string>()
  let hierarchies = 0
  let elements = 0
  let systemUnits = 0

  for (const tag of tags) {
    if (tag.close) continue
    const name = local(tag.name)
    if (name === "InstanceHierarchy") {
      hierarchies += 1
      records.push({ id: `hierarchy:${tag.attrs.Name ?? hierarchies}`, kind: "hierarchy", fields: { name: tag.attrs.Name ?? "", line: tag.line } })
      continue
    }
    if (name === "SystemUnitClass") systemUnits += 1
    if (name === "InternalElement") {
      elements += 1
      const id = tag.attrs.ID ?? ""
      if (!id) {
        issues.push({ code: "element-without-id", severity: "error", message: "InternalElement has no ID", line: tag.line })
      } else if (ids.has(id)) {
        issues.push({ code: "duplicate-id", severity: "error", message: `InternalElement ID ${id} appears twice`, line: tag.line })
      }
      ids.add(id)
      records.push({ id: `element:${id || elements}`, kind: "element", fields: { id, name: tag.attrs.Name ?? "", line: tag.line } })
    }
  }

  const rootName = local(root)
  if (rootName !== "CAEXFile") {
    issues.push({ code: "bad-root", severity: "error", message: `Root must be CAEXFile, found ${rootName || "nothing"}` })
  }
  if (hierarchies === 0) issues.push({ code: "no-hierarchy", severity: "error", message: "File has no InstanceHierarchy" })
  if (elements === 0) issues.push({ code: "no-elements", severity: "warning", message: "File has no InternalElement" })

  return {
    format: "AutomationML",
    records,
    meta: { root: rootName, hierarchies, elements, systemUnits },
    issues,
  }
}

const reference = [
  "AutomationML (CAEX XML)",
  "",
  '<CAEXFile xmlns="http://www.automationml.org/CAEX/2.15" SchemaVersion="2.15">',
  '  <InstanceHierarchy Name="Plant">',
  '    <InternalElement Name="Tank" ID="ie1"/>',
  "  </InstanceHierarchy>",
  "</CAEXFile>",
  "",
  "Root is CAEXFile.",
  "InstanceHierarchy holds the plant objects.",
  "Every InternalElement needs a unique ID.",
].join("\n")

export const format: FormatModule = {
  slug: "automationml",
  displayName: "AutomationML",
  extensions: [".aml", ".caex"],
  description: "Parse AutomationML CAEX files, validate hierarchies, elements and IDs.",
  reference,
  parse,
  sample: () =>
    [
      '<?xml version="1.0"?>',
      '<CAEXFile xmlns="http://www.automationml.org/CAEX/2.15" SchemaVersion="2.15">',
      '  <InstanceHierarchy Name="Plant">',
      '    <InternalElement Name="Tank" ID="ie1"/>',
      '    <InternalElement Name="Pump" ID="ie2"/>',
      "  </InstanceHierarchy>",
      "</CAEXFile>",
    ].join("\n") + "\n",
}
