import type { FormatModule, Parsed, ParsedRecord } from "./types.js"
import { readRoot, scanTags, validateXml } from "./_xml.js"

const local = (name: string): string => (name.includes(":") ? name.slice(name.lastIndexOf(":") + 1) : name)
const ID_ELEMENTS = new Set(["definition", "test", "object", "state", "variable"])

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const root = readRoot(text)
  validateXml(text, root, "OVAL definitions", issues)

  const tags = scanTags(text)
  const records: ParsedRecord[] = []
  const ids = new Set<string>()
  const counts = { definitions: 0, tests: 0, objects: 0, states: 0, variables: 0 }

  for (const tag of tags) {
    if (tag.close) continue
    const name = local(tag.name)
    if (!ID_ELEMENTS.has(name)) continue
    const bucket = name === "definition" ? "definitions" : `${name}s`
    if (bucket in counts) counts[bucket as keyof typeof counts] += 1
    const id = tag.attrs.id ?? ""
    if (!id) {
      issues.push({ code: "missing-id", severity: "error", message: `${name} has no id`, line: tag.line })
    } else if (!id.startsWith("oval:")) {
      issues.push({ code: "bad-id", severity: "error", message: `${name} id must start with oval: (${id})`, line: tag.line })
    } else if (ids.has(id)) {
      issues.push({ code: "duplicate-id", severity: "error", message: `id ${id} appears twice`, line: tag.line })
    }
    ids.add(id)
    records.push({ id: `oval:${id || records.length}`, kind: name, fields: { id, line: tag.line } })
  }

  if (local(root) !== "oval_definitions") {
    issues.push({ code: "bad-root", severity: "error", message: `Root must be oval_definitions, found ${root || "nothing"}` })
  }
  if (counts.definitions === 0) issues.push({ code: "no-definitions", severity: "error", message: "File has no definition" })
  if (counts.tests === 0) issues.push({ code: "no-tests", severity: "warning", message: "File has no test" })

  return {
    format: "OVAL",
    records,
    meta: counts,
    issues,
  }
}

const reference = [
  "OVAL definitions (XML)",
  "",
  '<oval_definitions xmlns="http://oval.mitre.org/XMLSchema/oval-definitions-5">',
  "  <definitions>",
  '    <definition id="oval:com.example:def:1" class="compliance">',
  "      <metadata><title>Check</title></metadata>",
  "    </definition>",
  "  </definitions>",
  "  <tests>",
  '    <test id="oval:com.example:tst:1" check="all"/>',
  "  </tests>",
  "</oval_definitions>",
  "",
  "Root is oval_definitions.",
  "Every definition, test, object, state and variable has an id.",
  "All ids start with oval: and must be unique.",
].join("\n")

export const format: FormatModule = {
  slug: "oval",
  displayName: "OVAL",
  extensions: [".xml", ".oval"],
  description: "Parse OVAL definitions, validate ids, definitions and tests.",
  reference,
  parse,
  sample: () =>
    [
      '<?xml version="1.0"?>',
      '<oval_definitions xmlns="http://oval.mitre.org/XMLSchema/oval-definitions-5">',
      "  <definitions>",
      '    <definition id="oval:com.example:def:1" class="compliance">',
      "      <metadata><title>Check</title></metadata>",
      "    </definition>",
      "  </definitions>",
      "  <tests>",
      '    <test id="oval:com.example:tst:1" check="all"/>',
      "  </tests>",
      "</oval_definitions>",
    ].join("\n") + "\n",
}
