import type { FormatModule, Parsed, ParsedRecord } from "./types.js"
import { readRoot, scanTags, validateXml } from "./_xml.js"

const local = (name: string): string => (name.includes(":") ? name.slice(name.lastIndexOf(":") + 1) : name)

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const root = readRoot(text)
  validateXml(text, root, "SCORM manifest", issues)

  const tags = scanTags(text)
  const records: ParsedRecord[] = []
  const resources = new Set<string>()
  const items: Array<{ identifier: string; ref: string; line: number }> = []
  let organizations = 0

  for (const tag of tags) {
    if (tag.close) continue
    const name = local(tag.name)
    if (name === "manifest") {
      if (!tag.attrs.identifier) {
        issues.push({ code: "manifest-without-id", severity: "error", message: "manifest has no identifier", line: tag.line })
      }
      records.push({ id: "manifest", kind: "manifest", fields: { identifier: tag.attrs.identifier ?? "", version: tag.attrs.version ?? "", line: tag.line } })
      continue
    }
    if (name === "organization") {
      organizations += 1
      records.push({ id: `organization:${tag.attrs.identifier ?? organizations}`, kind: "organization", fields: { identifier: tag.attrs.identifier ?? "", line: tag.line } })
      continue
    }
    if (name === "item") {
      const identifier = tag.attrs.identifier ?? ""
      if (!identifier) issues.push({ code: "item-without-id", severity: "error", message: "item has no identifier", line: tag.line })
      items.push({ identifier, ref: tag.attrs.identifierref ?? "", line: tag.line })
      records.push({ id: `item:${identifier || items.length}`, kind: "item", fields: { identifier, ref: tag.attrs.identifierref ?? "", line: tag.line } })
      continue
    }
    if (name === "resource") {
      const identifier = tag.attrs.identifier ?? ""
      if (!identifier) {
        issues.push({ code: "resource-without-id", severity: "error", message: "resource has no identifier", line: tag.line })
      } else if (resources.has(identifier)) {
        issues.push({ code: "duplicate-resource", severity: "error", message: `Resource ${identifier} appears twice`, line: tag.line })
      }
      resources.add(identifier)
      if (!tag.attrs.href && !tag.attrs.type) {
        issues.push({ code: "resource-without-href", severity: "warning", message: `Resource ${identifier || tag.line} has no href`, line: tag.line })
      }
      records.push({ id: `resource:${identifier || resources.size}`, kind: "resource", fields: { identifier, href: tag.attrs.href ?? "", type: tag.attrs.type ?? "", line: tag.line } })
    }
  }

  for (const item of items) {
    if (item.ref && !resources.has(item.ref)) {
      issues.push({ code: "missing-resource", severity: "error", message: `Item ${item.identifier} points at resource ${item.ref}, which is not defined`, line: item.line })
    }
  }

  if (local(root) !== "manifest") {
    issues.push({ code: "bad-root", severity: "error", message: `Root must be manifest, found ${root || "nothing"}` })
  }
  if (resources.size === 0) issues.push({ code: "no-resources", severity: "error", message: "Manifest has no resource" })
  if (organizations === 0) issues.push({ code: "no-organizations", severity: "warning", message: "Manifest has no organization" })

  return {
    format: "SCORM",
    records,
    meta: { resources: resources.size, items: items.length, organizations, version: records.find((record) => record.kind === "manifest")?.fields.version ?? "" },
    issues,
  }
}

const reference = [
  "SCORM manifest (imsmanifest.xml)",
  "",
  "<manifest identifier=\"COURSE1\" version=\"1.0\">",
  "  <organizations>",
  "    <organization identifier=\"ORG1\">",
  "      <item identifier=\"ITEM1\" identifierref=\"RES1\"><title>Lesson</title></item>",
  "    </organization>",
  "  </organizations>",
  "  <resources>",
  "    <resource identifier=\"RES1\" type=\"webcontent\" href=\"index.html\"/>",
  "  </resources>",
  "</manifest>",
  "",
  "Root is manifest and needs an identifier.",
  "Items point at resources through identifierref.",
  "Every reference must match a declared resource.",
].join("\n")

export const format: FormatModule = {
  slug: "scorm",
  displayName: "SCORM",
  extensions: [".xml"],
  description: "Parse SCORM manifests, validate organizations, items and resource links.",
  reference,
  parse,
  sample: () =>
    [
      '<?xml version="1.0"?>',
      '<manifest identifier="COURSE1" version="1.0">',
      "  <organizations>",
      '    <organization identifier="ORG1">',
      '      <item identifier="ITEM1" identifierref="RES1"><title>Lesson</title></item>',
      "    </organization>",
      "  </organizations>",
      "  <resources>",
      '    <resource identifier="RES1" type="webcontent" href="index.html"/>',
      "  </resources>",
      "</manifest>",
    ].join("\n") + "\n",
}
