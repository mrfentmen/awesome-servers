import type { FormatModule, Parsed, ParsedRecord } from "./types.js"
import { readRoot, scanTags, validateXml } from "./_xml.js"

const local = (name: string): string => (name.includes(":") ? name.slice(name.lastIndexOf(":") + 1) : name)

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const root = readRoot(text)
  validateXml(text, root, "ATML document", issues)

  const tags = scanTags(text)
  const records: ParsedRecord[] = []
  const ids = new Set<string>()
  const counts = { descriptions: 0, stations: 0, uuts: 0, results: 0, instruments: 0 }

  for (const tag of tags) {
    if (tag.close) continue
    const name = local(tag.name)
    const bucket =
      name === "TestDescription" ? "descriptions" :
      name === "TestStation" ? "stations" :
      name === "UUT" ? "uuts" :
      name === "TestResult" ? "results" :
      name === "Instrument" ? "instruments" : ""
    if (!bucket) continue
    counts[bucket] += 1
    const id = tag.attrs.ID ?? tag.attrs.id ?? ""
    if (id) {
      if (ids.has(id)) issues.push({ code: "duplicate-id", severity: "error", message: `ID ${id} appears twice`, line: tag.line })
      ids.add(id)
    }
    records.push({ id: `${name}:${id || records.length}`, kind: name, fields: { id, line: tag.line } })
  }

  if (local(root) !== "ATML") {
    issues.push({ code: "bad-root", severity: "error", message: `Root must be ATML, found ${root || "nothing"}` })
  }
  if (counts.descriptions === 0) issues.push({ code: "no-description", severity: "error", message: "Document has no TestDescription" })
  if (counts.results === 0) issues.push({ code: "no-results", severity: "warning", message: "Document has no TestResult" })

  return {
    format: "ATML",
    records,
    meta: counts,
    issues,
  }
}

const reference = [
  "ATML test description (XML)",
  "",
  "<ATML>",
  '  <TestDescription ID="TD1">',
  '    <UUT name="board"/>',
  "    <TestResult>",
  '      <Test ID="T1" result="pass"/>',
  "    </TestResult>",
  "  </TestDescription>",
  "</ATML>",
  "",
  "Root is ATML.",
  "A TestDescription describes what is tested.",
  "TestResult carries the measured outcome.",
].join("\n")

export const format: FormatModule = {
  slug: "atml",
  displayName: "ATML",
  extensions: [".xml", ".atml"],
  description: "Parse ATML descriptions, validate test items, stations and results.",
  reference,
  parse,
  sample: () =>
    [
      '<?xml version="1.0"?>',
      "<ATML>",
      '  <TestDescription ID="TD1">',
      '    <UUT name="board"/>',
      "    <TestResult>",
      '      <Test ID="T1" result="pass"/>',
      "    </TestResult>",
      "  </TestDescription>",
      "</ATML>",
    ].join("\n") + "\n",
}
