import type { FormatModule, Parsed, ParsedRecord } from "./types.js"
import { readRoot, scanTags, validateXml } from "./_xml.js"

const local = (name: string): string => (name.includes(":") ? name.slice(name.lastIndexOf(":") + 1) : name)

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const root = readRoot(text)
  validateXml(text, root, "SBML model", issues)

  const tags = scanTags(text)
  const records: ParsedRecord[] = []
  const compartments = new Set<string>()
  const species = new Set<string>()
  const refs: Array<{ id: string; line: number }> = []
  let model = 0
  let reactions = 0

  for (const tag of tags) {
    if (tag.close) continue
    const name = local(tag.name)
    if (name === "model") {
      model += 1
      if (!tag.attrs.id) issues.push({ code: "model-id", severity: "warning", message: "model has no id", line: tag.line })
      continue
    }
    if (name === "compartment") {
      const id = tag.attrs.id ?? ""
      if (!id) issues.push({ code: "compartment-id", severity: "error", message: "compartment has no id", line: tag.line })
      else compartments.add(id)
      continue
    }
    if (name === "species") {
      const id = tag.attrs.id ?? ""
      const compartment = tag.attrs.compartment ?? ""
      if (!id) issues.push({ code: "species-id", severity: "error", message: "species has no id", line: tag.line })
      else species.add(id)
      if (!compartment) issues.push({ code: "species-compartment", severity: "error", message: `species ${id || "(no id)"} has no compartment`, line: tag.line })
      else if (compartments.size > 0 && !compartments.has(compartment)) {
        issues.push({ code: "unknown-compartment", severity: "error", message: `species ${id} uses unknown compartment ${compartment}`, line: tag.line })
      }
      if (id) records.push({ id, kind: "species", fields: { compartment, line: tag.line } })
      continue
    }
    if (name === "reaction") {
      reactions += 1
      const id = tag.attrs.id ?? ""
      if (!id) issues.push({ code: "reaction-id", severity: "error", message: "reaction has no id", line: tag.line })
      records.push({ id: id || `reaction:${reactions}`, kind: "reaction", fields: { reversible: tag.attrs.reversible ?? "true", line: tag.line } })
      continue
    }
    if (name === "speciesReference") {
      const ref = tag.attrs.species ?? ""
      if (!ref) issues.push({ code: "empty-ref", severity: "error", message: "speciesReference has no species", line: tag.line })
      else refs.push({ id: ref, line: tag.line })
    }
  }

  for (const ref of refs) {
    if (!species.has(ref.id)) issues.push({ code: "unknown-species", severity: "error", message: `Reaction references unknown species ${ref.id}`, line: ref.line })
  }

  if (local(root) !== "sbml") issues.push({ code: "bad-root", severity: "error", message: `Root must be sbml, found ${root || "nothing"}` })
  if (model === 0) issues.push({ code: "no-model", severity: "error", message: "File has no model element" })
  if (species.size === 0) issues.push({ code: "no-species", severity: "error", message: "Model has no species" })
  if (reactions === 0) issues.push({ code: "no-reactions", severity: "warning", message: "Model has no reactions" })

  return {
    format: "SBML",
    records,
    meta: { compartments: compartments.size, species: species.size, reactions },
    issues,
  }
}

const reference = [
  "SBML systems biology model",
  "",
  '<sbml xmlns="http://www.sbml.org/sbml/level3/version2/core" level="3" version="2">',
  '  <model id="demo">',
  '    <listOfCompartments><compartment id="cell" size="1"/></listOfCompartments>',
  '    <listOfSpecies><species id="A" compartment="cell" initialAmount="10"/></listOfSpecies>',
  '    <listOfReactions><reaction id="R1" reversible="false">',
  '      <listOfReactants><speciesReference species="A"/></listOfReactants>',
  "    </reaction></listOfReactions>",
  "  </model>",
  "</sbml>",
  "",
  "Root is sbml and needs a model.",
  "Every species needs a compartment that exists.",
  "Every speciesReference must name a declared species.",
].join("\n")

export const format: FormatModule = {
  slug: "sbml",
  displayName: "SBML",
  extensions: [".sbml", ".xml"],
  description: "Parse SBML models, validate compartments, species and reaction references.",
  reference,
  parse,
  sample: () =>
    [
      '<?xml version="1.0"?>',
      '<sbml xmlns="http://www.sbml.org/sbml/level3/version2/core" level="3" version="2">',
      '  <model id="demo">',
      '    <listOfCompartments><compartment id="cell" size="1"/></listOfCompartments>',
      '    <listOfSpecies>',
      '      <species id="A" compartment="cell" initialAmount="10"/>',
      '      <species id="B" compartment="cell" initialAmount="0"/>',
      "    </listOfSpecies>",
      '    <listOfReactions><reaction id="R1" reversible="false">',
      '      <listOfReactants><speciesReference species="A"/></listOfReactants>',
      '      <listOfProducts><speciesReference species="B"/></listOfProducts>',
      "    </reaction></listOfReactions>",
      "  </model>",
      "</sbml>",
    ].join("\n") + "\n",
}
