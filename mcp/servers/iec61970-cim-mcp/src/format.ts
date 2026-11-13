import type { FormatModule, Parsed, ParsedRecord } from "./types.js"
import { readRoot, scanTags, validateXml } from "./_xml.js"

const local = (name: string): string => (name.includes(":") ? name.slice(name.lastIndexOf(":") + 1) : name)
const prefix = (name: string): string => (name.includes(":") ? name.slice(0, name.indexOf(":")) : "")

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const root = readRoot(text)
  validateXml(text, root, "CIM/RDF file", issues)

  const tags = scanTags(text)
  const records: ParsedRecord[] = []
  const ids = new Set<string>()
  const classes = new Map<string, number>()
  let cimElements = 0

  for (const tag of tags) {
    if (tag.close) continue
    if (!/^cim:/i.test(tag.name)) continue
    cimElements += 1
    const className = local(tag.name)
    classes.set(className, (classes.get(className) ?? 0) + 1)
    const id = tag.attrs["rdf:ID"] ?? tag.attrs["rdf:id"] ?? ""
    if (id) {
      if (ids.has(id)) issues.push({ code: "duplicate-id", severity: "error", message: `rdf:ID ${id} appears twice`, line: tag.line })
      ids.add(id)
    }
    records.push({ id: `cim:${id || records.length}`, kind: className, fields: { id, line: tag.line } })
  }

  const rootName = local(root)
  if (rootName !== "RDF") {
    issues.push({ code: "bad-root", severity: "error", message: `Root must be rdf:RDF, found ${rootName || "nothing"}` })
  }
  if (cimElements === 0) {
    issues.push({ code: "no-cim", severity: "error", message: "File has no cim: element" })
  }

  const classList = [...classes.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name]) => name)

  return {
    format: "CIM/XML",
    records,
    meta: { root: rootName, cimElements, classes: classes.size, topClasses: classList.join(",") },
    issues,
  }
}

const reference = [
  "IEC 61970 Common Information Model (RDF/XML)",
  "",
  '<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"',
  '         xmlns:cim="http://iec.ch/TC57/2013/CIM-schema-cim16#">',
  '  <cim:Substation rdf:ID="sub1">',
  "    <cim:IdentifiedObject.name>North</cim:IdentifiedObject.name>",
  "  </cim:Substation>",
  "  <cim:Breaker rdf:ID=\"br1\"/>",
  "</rdf:RDF>",
  "",
  "Root is rdf:RDF; model objects use the cim: prefix.",
  "rdf:ID values must be unique.",
  "Class names come from the CIM schema, such as Substation and Breaker.",
].join("\n")

export const format: FormatModule = {
  slug: "iec61970-cim",
  displayName: "CIM/XML",
  extensions: [".xml", ".rdf"],
  description: "Parse IEC 61970 CIM RDF files, validate classes, IDs and namespaces.",
  reference,
  parse,
  sample: () =>
    [
      '<?xml version="1.0"?>',
      '<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"',
      '         xmlns:cim="http://iec.ch/TC57/2013/CIM-schema-cim16#">',
      '  <cim:Substation rdf:ID="sub1">',
      "    <cim:IdentifiedObject.name>North</cim:IdentifiedObject.name>",
      "  </cim:Substation>",
      '  <cim:Breaker rdf:ID="br1"/>',
      "</rdf:RDF>",
    ].join("\n") + "\n",
}
