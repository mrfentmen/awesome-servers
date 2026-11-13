import type { FormatModule, Parsed, ParsedRecord } from "./types.js"
import { readRoot, scanTags, validateXml } from "./_xml.js"

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const root = readRoot(text)
  validateXml(text, root, "Duck Creek manifest", issues)

  const tags = scanTags(text)
  const records: ParsedRecord[] = []
  const named = new Map<string, number>()
  let elements = 0

  for (const tag of tags) {
    if (tag.close) continue
    elements += 1
    const name = tag.attrs.name ?? tag.attrs.Name ?? tag.attrs.id ?? tag.attrs.ID ?? ""
    if (name) {
      if (named.has(name)) {
        issues.push({ code: "duplicate-name", severity: "error", message: `${tag.name} ${name} appears twice`, line: tag.line })
      }
      named.set(name, tag.line)
    }
    records.push({ id: `${tag.name}:${name || elements}`, kind: tag.name, fields: { name, version: tag.attrs.version ?? "", line: tag.line } })
  }

  if (elements === 0) {
    issues.push({ code: "no-elements", severity: "error", message: "Manifest has no elements" })
  }
  if (named.size === 0) {
    issues.push({ code: "no-names", severity: "warning", message: "No element carries a name or id" })
  }

  return {
    format: "Duck Creek",
    records,
    meta: {
      root,
      elements,
      named: named.size,
      kinds: new Set(records.map((record) => record.kind)).size,
    },
    issues,
  }
}

const reference = [
  "Duck Creek manifest (XML)",
  "",
  "<Manifest version=\"1.0\">",
  "  <Package name=\"Base\" version=\"1.0\"/>",
  "  <Package name=\"Auto\" version=\"1.0\"/>",
  "</Manifest>",
  "",
  "Duck Creek ships configuration and package manifests as XML.",
  "Element name and id attributes must be unique.",
  "The root element is reported, not enforced.",
].join("\n")

export const format: FormatModule = {
  slug: "duck-creek",
  displayName: "Duck Creek",
  extensions: [".dct", ".manifest"],
  description: "Parse Duck Creek XML manifests, validate structure and duplicate names.",
  reference,
  parse,
  sample: () =>
    [
      '<?xml version="1.0"?>',
      '<Manifest version="1.0">',
      '  <Package name="Base" version="1.0"/>',
      '  <Package name="Auto" version="1.0"/>',
      "</Manifest>",
    ].join("\n") + "\n",
}
