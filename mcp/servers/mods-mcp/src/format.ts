import type { FormatModule, Parsed, ParsedRecord } from "./types.js"
import { readRoot, scanTags, validateXml } from "./_xml.js"

const local = (name: string): string => (name.includes(":") ? name.slice(name.lastIndexOf(":") + 1) : name)
const NAME_TYPES = new Set(["personal", "corporate", "family", "conference"])

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const root = readRoot(text)
  validateXml(text, root, "MODS record", issues)

  const tags = scanTags(text)
  const records: ParsedRecord[] = []
  let titles = 0
  let names = 0
  let identifiers = 0
  let subjects = 0
  const version = /<mods\b[^>]*version="([^"]+)"/i.exec(text)?.[1] ?? ""

  for (const tag of tags) {
    if (tag.close) continue
    const name = local(tag.name)
    if (name === "title") {
      titles += 1
      continue
    }
    if (name === "name") {
      names += 1
      const type = tag.attrs.type ?? ""
      if (!type) issues.push({ code: "name-type", severity: "warning", message: "name has no type", line: tag.line })
      else if (!NAME_TYPES.has(type)) issues.push({ code: "bad-name-type", severity: "error", message: `Unknown name type: ${type}`, line: tag.line })
      records.push({ id: `name:${names}`, kind: "name", fields: { type, line: tag.line } })
      continue
    }
    if (name === "identifier") {
      identifiers += 1
      if (!tag.attrs.type) issues.push({ code: "identifier-type", severity: "warning", message: "identifier has no type", line: tag.line })
      continue
    }
    if (name === "subject") subjects += 1
  }

  if (root !== "mods") issues.push({ code: "bad-root", severity: "error", message: `Root must be mods, found ${root || "nothing"}` })
  if (version && !/^3\./.test(version)) issues.push({ code: "bad-version", severity: "error", message: `MODS 3.x expected, found ${version}` })
  if (titles === 0) issues.push({ code: "no-title", severity: "error", message: "Record has no title" })
  if (identifiers === 0) issues.push({ code: "no-identifier", severity: "warning", message: "Record has no identifier" })

  return { format: "MODS", records, meta: { version: version || "unknown", titles, names, identifiers, subjects }, issues }
}

const reference = [
  "MODS bibliographic record",
  "",
  '<mods xmlns="http://www.loc.gov/mods/v3" version="3.8">',
  "  <titleInfo><title>Demo record</title></titleInfo>",
  '  <name type="personal"><namePart>Ada Lovelace</namePart></name>',
  '  <typeOfResource>text</typeOfResource>',
  '  <genre>article</genre>',
  '  <identifier type="doi">10.1000/demo</identifier>',
  "  <subject><topic>computing</topic></subject>",
  "</mods>",
  "",
  "Root is mods and version starts with 3.",
  "A record needs a title.",
  "name type is personal, corporate, family or conference.",
].join("\n")

export const format: FormatModule = {
  slug: "mods",
  displayName: "MODS",
  extensions: [".xml"],
  description: "Parse MODS records, validate titles, names, identifiers and version.",
  reference,
  parse,
  sample: () =>
    [
      '<?xml version="1.0"?>',
      '<mods xmlns="http://www.loc.gov/mods/v3" version="3.8">',
      "  <titleInfo><title>Demo record</title></titleInfo>",
      '  <name type="personal"><namePart>Ada Lovelace</namePart></name>',
      "  <typeOfResource>text</typeOfResource>",
      "  <genre>article</genre>",
      '  <identifier type="doi">10.1000/demo</identifier>',
      "  <subject><topic>computing</topic></subject>",
      "</mods>",
    ].join("\n") + "\n",
}
