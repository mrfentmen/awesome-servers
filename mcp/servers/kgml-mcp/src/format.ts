import type { FormatModule, Parsed, ParsedRecord } from "./types.js"
import { readRoot, scanTags, validateXml } from "./_xml.js"

const local = (name: string): string => (name.includes(":") ? name.slice(name.lastIndexOf(":") + 1) : name)

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const root = readRoot(text)
  validateXml(text, root, "KGML pathway", issues)

  const tags = scanTags(text)
  const records: ParsedRecord[] = []
  const entries = new Set<string>()
  const relations: Array<{ entry1: string; entry2: string; line: number }> = []
  let entryCount = 0
  let reactionCount = 0
  let graphics = 0
  let organism = ""
  let number = ""

  for (const tag of tags) {
    if (tag.close) continue
    const name = local(tag.name)
    if (name === "pathway") {
      organism = tag.attrs.org ?? ""
      number = tag.attrs.number ?? ""
      if (!tag.attrs.name) issues.push({ code: "no-pathway-name", severity: "error", message: "pathway has no name", line: tag.line })
      if (!organism) issues.push({ code: "no-organism", severity: "error", message: "pathway has no org", line: tag.line })
      records.push({ id: "pathway", kind: "pathway", fields: { name: tag.attrs.name ?? "", org: organism, number, title: tag.attrs.title ?? "", line: tag.line } })
      continue
    }
    if (name === "entry") {
      entryCount += 1
      const id = tag.attrs.id ?? ""
      if (!id) issues.push({ code: "entry-without-id", severity: "error", message: "entry has no id", line: tag.line })
      else if (entries.has(id)) issues.push({ code: "duplicate-entry", severity: "error", message: `entry id ${id} appears twice`, line: tag.line })
      entries.add(id)
      records.push({ id: `entry:${id || entryCount}`, kind: "entry", fields: { id, type: tag.attrs.type ?? "", name: tag.attrs.name ?? "", line: tag.line } })
      continue
    }
    if (name === "relation") {
      relations.push({ entry1: tag.attrs.entry1 ?? "", entry2: tag.attrs.entry2 ?? "", line: tag.line })
      records.push({ id: `relation:${relations.length}`, kind: "relation", fields: { entry1: tag.attrs.entry1 ?? "", entry2: tag.attrs.entry2 ?? "", type: tag.attrs.type ?? "", line: tag.line } })
      continue
    }
    if (name === "reaction") {
      reactionCount += 1
      records.push({ id: `reaction:${reactionCount}`, kind: "reaction", fields: { id: tag.attrs.id ?? "", name: tag.attrs.name ?? "", type: tag.attrs.type ?? "", line: tag.line } })
      continue
    }
    if (name === "graphics") graphics += 1
  }

  for (const relation of relations) {
    for (const id of [relation.entry1, relation.entry2]) {
      if (id && !entries.has(id)) {
        issues.push({ code: "missing-entry", severity: "error", message: `relation points at unknown entry ${id}`, line: relation.line })
      }
    }
  }

  if (local(root) !== "pathway") {
    issues.push({ code: "bad-root", severity: "error", message: `Root must be pathway, found ${root || "nothing"}` })
  }
  if (entryCount === 0) issues.push({ code: "no-entries", severity: "error", message: "Pathway has no entry" })
  if (graphics === 0) issues.push({ code: "no-graphics", severity: "warning", message: "Pathway has no graphics block" })

  return {
    format: "KGML",
    records,
    meta: { organism, number, entries: entryCount, relations: relations.length, reactions: reactionCount, graphics },
    issues,
  }
}

const reference = [
  "KEGG KGML pathway (XML)",
  "",
  '<pathway name="path:hsa00010" org="hsa" number="00010" title="Glycolysis">',
  '  <entry id="1" name="hsa:10327" type="gene"/>',
  '  <entry id="2" name="cpd:C00031" type="compound"/>',
  '  <relation entry1="1" entry2="2" type="PCrel"/>',
  '  <reaction id="3" name="rn:R01068" type="irreversible"/>',
  "</pathway>",
  "",
  "Root is pathway with org and number.",
  "entry ids are unique within the pathway.",
  "Relations reference two existing entries.",
].join("\n")

export const format: FormatModule = {
  slug: "kgml",
  displayName: "KGML",
  extensions: [".xml", ".kgml"],
  description: "Parse KEGG KGML pathways, validate entries, relations and reactions.",
  reference,
  parse,
  sample: () =>
    [
      '<?xml version="1.0"?>',
      '<pathway name="path:hsa00010" org="hsa" number="00010" title="Glycolysis">',
      '  <entry id="1" name="hsa:10327" type="gene"/>',
      '  <entry id="2" name="cpd:C00031" type="compound"/>',
      '  <relation entry1="1" entry2="2" type="PCrel"/>',
      '  <reaction id="3" name="rn:R01068" type="irreversible"/>',
      "</pathway>",
    ].join("\n") + "\n",
}
