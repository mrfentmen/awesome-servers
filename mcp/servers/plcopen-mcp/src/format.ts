import type { FormatModule, Parsed, ParsedRecord } from "./types.js"
import { readRoot, scanTags, validateXml } from "./_xml.js"

const local = (name: string): string => (name.includes(":") ? name.slice(name.lastIndexOf(":") + 1) : name)
const POU_TYPES = new Set(["program", "functionBlock", "function"])

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const root = readRoot(text)
  validateXml(text, root, "PLCopen XML", issues)

  const tags = scanTags(text)
  const records: ParsedRecord[] = []
  const names = new Set<string>()
  let pous = 0
  let dataTypes = 0

  for (const tag of tags) {
    if (tag.close) continue
    const name = local(tag.name)
    if (name === "pou") {
      pous += 1
      const pouName = tag.attrs.name ?? ""
      const pouType = tag.attrs.pouType ?? ""
      if (!pouName) issues.push({ code: "pou-without-name", severity: "error", message: "pou has no name", line: tag.line })
      else if (names.has(pouName)) issues.push({ code: "duplicate-pou", severity: "error", message: `pou ${pouName} appears twice`, line: tag.line })
      names.add(pouName)
      if (!POU_TYPES.has(pouType)) {
        issues.push({ code: "bad-pou-type", severity: "error", message: `pouType must be program, functionBlock or function: ${pouType || "(empty)"}`, line: tag.line })
      }
      records.push({ id: `pou:${pouName || pous}`, kind: "pou", fields: { name: pouName, type: pouType, line: tag.line } })
      continue
    }
    if (name === "dataType") {
      dataTypes += 1
      records.push({ id: `type:${tag.attrs.name ?? dataTypes}`, kind: "dataType", fields: { name: tag.attrs.name ?? "", line: tag.line } })
    }
  }

  if (local(root) !== "project") {
    issues.push({ code: "bad-root", severity: "error", message: `Root must be project, found ${root || "nothing"}` })
  }
  if (pous === 0) issues.push({ code: "no-pous", severity: "error", message: "Project has no pou" })

  return {
    format: "PLCopen XML",
    records,
    meta: { pous, dataTypes, names: names.size },
    issues,
  }
}

const reference = [
  "PLCopen XML (TC6)",
  "",
  '<project xmlns="http://www.plcopen.org/xml/tc6_0201">',
  "  <fileHeader companyName=\"Demo\" productName=\"Demo\" />",
  "  <types />",
  "  <instances />",
  "  <pous>",
  '    <pou name="Main" pouType="program" />',
  "  </pous>",
  "</project>",
  "",
  "Root is project.",
  "Each pou has a unique name and a pouType: program, functionBlock or function.",
].join("\n")

export const format: FormatModule = {
  slug: "plcopen",
  displayName: "PLCopen XML",
  extensions: [".xml", ".plcopen"],
  description: "Parse PLCopen XML, validate project root, POUs and types.",
  reference,
  parse,
  sample: () =>
    [
      '<?xml version="1.0"?>',
      '<project xmlns="http://www.plcopen.org/xml/tc6_0201">',
      '  <fileHeader companyName="Demo" productName="Demo" />',
      "  <types />",
      "  <instances />",
      "  <pous>",
      '    <pou name="Main" pouType="program" />',
      '    <pou name="Belt" pouType="functionBlock" />',
      "  </pous>",
      "</project>",
    ].join("\n") + "\n",
}
