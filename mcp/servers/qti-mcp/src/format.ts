import type { FormatModule, Parsed, ParsedRecord } from "./types.js"
import { readRoot, scanTags, validateXml } from "./_xml.js"

const local = (name: string): string => (name.includes(":") ? name.slice(name.lastIndexOf(":") + 1) : name)

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const root = readRoot(text)
  validateXml(text, root, "QTI file", issues)

  const tags = scanTags(text)
  const records: ParsedRecord[] = []
  let items = 0
  let sections = 0
  let bodies = 0
  let interactions = 0

  for (const tag of tags) {
    if (tag.close) continue
    const name = local(tag.name)
    if (name === "assessmentItem") {
      items += 1
      if (!tag.attrs.identifier) issues.push({ code: "item-without-id", severity: "error", message: "assessmentItem has no identifier", line: tag.line })
      if (tag.attrs.timeDependent === "true" && !tag.attrs.timeLimits) {
        issues.push({ code: "timed-without-limits", severity: "warning", message: "timeDependent item has no timeLimits", line: tag.line })
      }
      records.push({ id: `item:${tag.attrs.identifier ?? items}`, kind: "item", fields: { identifier: tag.attrs.identifier ?? "", title: tag.attrs.title ?? "", line: tag.line } })
      continue
    }
    if (name === "testPart" || name === "assessmentSection") {
      sections += 1
      if (!tag.attrs.identifier) issues.push({ code: "section-without-id", severity: "error", message: `${name} has no identifier`, line: tag.line })
      records.push({ id: `section:${tag.attrs.identifier ?? sections}`, kind: "section", fields: { kind: name, identifier: tag.attrs.identifier ?? "", line: tag.line } })
      continue
    }
    if (name === "itemBody") {
      bodies += 1
      records.push({ id: `body:${bodies}`, kind: "body", fields: { line: tag.line } })
      continue
    }
    if (name.endsWith("Interaction")) {
      interactions += 1
      records.push({ id: `interaction:${interactions}`, kind: "interaction", fields: { type: name, line: tag.line } })
    }
  }

  const rootName = local(root)
  if (rootName !== "assessmentItem" && rootName !== "assessmentTest") {
    issues.push({ code: "bad-root", severity: "error", message: `Root must be assessmentItem or assessmentTest, found ${rootName || "nothing"}` })
  }
  if (rootName === "assessmentItem" && bodies === 0) {
    issues.push({ code: "no-body", severity: "error", message: "assessmentItem has no itemBody" })
  }
  if (items === 0 && rootName === "assessmentItem") {
    issues.push({ code: "no-items", severity: "error", message: "File has no assessmentItem" })
  }

  return {
    format: "QTI",
    records,
    meta: { root: rootName, items, sections, bodies, interactions },
    issues,
  }
}

const reference = [
  "QTI 2.1 assessment item",
  "",
  "<assessmentItem identifier=\"I1\" title=\"Demo\" adaptive=\"false\" timeDependent=\"false\">",
  "  <itemBody><p>What is 2 + 2?</p></itemBody>",
  "</assessmentItem>",
  "",
  "Root is assessmentItem for a question or assessmentTest for a test.",
  "Every item, testPart and section needs an identifier.",
  "Items carry an itemBody; interactions end in Interaction.",
].join("\n")

export const format: FormatModule = {
  slug: "qti",
  displayName: "QTI",
  extensions: [".xml"],
  description: "Parse QTI items and tests, validate identifiers, bodies and interactions.",
  reference,
  parse,
  sample: () =>
    [
      '<?xml version="1.0"?>',
      '<assessmentItem identifier="I1" title="Demo" adaptive="false" timeDependent="false">',
      "  <itemBody><p>What is 2 + 2?</p></itemBody>",
      "</assessmentItem>",
    ].join("\n") + "\n",
}
