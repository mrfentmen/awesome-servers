import type { FormatModule, Parsed, ParsedRecord } from "./types.js"
import { readRoot, scanTags, validateXml } from "./_xml.js"

const local = (name: string): string => (name.includes(":") ? name.slice(name.lastIndexOf(":") + 1) : name)

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const root = readRoot(text)
  validateXml(text, root, "BioPAX file", issues)

  const tags = scanTags(text)
  const records: ParsedRecord[] = []
  const ids = new Set<string>()
  const classes = new Map<string, number>()
  let elements = 0

  for (const tag of tags) {
    if (tag.close) continue
    if (!/^bp:/i.test(tag.name)) continue
    elements += 1
    const className = local(tag.name)
    classes.set(className, (classes.get(className) ?? 0) + 1)
    const id = tag.attrs["rdf:ID"] ?? tag.attrs["rdf:id"] ?? ""
    if (id) {
      if (ids.has(id)) issues.push({ code: "duplicate-id", severity: "error", message: `rdf:ID ${id} appears twice`, line: tag.line })
      ids.add(id)
    }
    records.push({ id: `bp:${id || records.length}`, kind: className, fields: { id, line: tag.line } })
  }

  const rootName = local(root)
  if (rootName !== "RDF") {
    issues.push({ code: "bad-root", severity: "error", message: `Root must be rdf:RDF, found ${rootName || "nothing"}` })
  }
  if (elements === 0) issues.push({ code: "no-biopax", severity: "error", message: "File has no bp: element" })
  const hasPathway = classes.has("Pathway")
  if (!hasPathway) issues.push({ code: "no-pathway", severity: "warning", message: "No bp:Pathway found" })

  const classList = [...classes.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name]) => name)

  return {
    format: "BioPAX",
    records,
    meta: { elements, classes: classes.size, topClasses: classList.join(","), pathways: classes.get("Pathway") ?? 0 },
    issues,
  }
}

const reference = [
  "BioPAX pathway data (RDF/XML)",
  "",
  '<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"',
  '         xmlns:bp="http://www.biopax.org/release/biopax-level3.owl#">',
  '  <bp:Pathway rdf:ID="pathway1">',
  "    <bp:displayName>Glycolysis</bp:displayName>",
  "  </bp:Pathway>",
  '  <bp:Protein rdf:ID="protein1"/>',
  "</rdf:RDF>",
  "",
  "Root is rdf:RDF; BioPAX objects use the bp: prefix.",
  "rdf:ID values must be unique.",
  "A pathway is the usual top-level object.",
].join("\n")

export const format: FormatModule = {
  slug: "biopax",
  displayName: "BioPAX",
  extensions: [".owl", ".rdf"],
  description: "Parse BioPAX RDF, validate objects, IDs and pathway classes.",
  reference,
  parse,
  sample: () =>
    [
      '<?xml version="1.0"?>',
      '<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"',
      '         xmlns:bp="http://www.biopax.org/release/biopax-level3.owl#">',
      '  <bp:Pathway rdf:ID="pathway1">',
      "    <bp:displayName>Glycolysis</bp:displayName>",
      "  </bp:Pathway>",
      '  <bp:Protein rdf:ID="protein1"/>',
      "</rdf:RDF>",
    ].join("\n") + "\n",
}
