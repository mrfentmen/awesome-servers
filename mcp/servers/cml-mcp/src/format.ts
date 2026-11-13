import type { FormatModule, Parsed, ParsedRecord } from "./types.js"
import { readRoot, scanTags, validateXml } from "./_xml.js"

const local = (name: string): string => (name.includes(":") ? name.slice(name.lastIndexOf(":") + 1) : name)

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const root = readRoot(text)
  validateXml(text, root, "CML file", issues)

  const tags = scanTags(text)
  const records: ParsedRecord[] = []
  const atoms = new Set<string>()
  const molecules = new Set<string>()
  let atomCount = 0
  let bondCount = 0

  for (const tag of tags) {
    if (tag.close) continue
    const name = local(tag.name)
    if (name === "molecule") {
      const id = tag.attrs.id ?? ""
      if (!id) issues.push({ code: "molecule-without-id", severity: "error", message: "molecule has no id", line: tag.line })
      else if (molecules.has(id)) issues.push({ code: "duplicate-molecule", severity: "error", message: `molecule ${id} appears twice`, line: tag.line })
      molecules.add(id)
      records.push({ id: `molecule:${id || molecules.size}`, kind: "molecule", fields: { id, line: tag.line } })
      continue
    }
    if (name === "atom") {
      atomCount += 1
      const id = tag.attrs.id ?? ""
      if (!id) issues.push({ code: "atom-without-id", severity: "error", message: "atom has no id", line: tag.line })
      else if (atoms.has(id)) issues.push({ code: "duplicate-atom", severity: "error", message: `atom ${id} appears twice`, line: tag.line })
      atoms.add(id)
      if (!tag.attrs.elementType) issues.push({ code: "atom-without-element", severity: "error", message: `atom ${id || atomCount} has no elementType`, line: tag.line })
      records.push({ id: `atom:${id || atomCount}`, kind: "atom", fields: { id, element: tag.attrs.elementType ?? "", line: tag.line } })
      continue
    }
    if (name === "bond") {
      bondCount += 1
      const refs = (tag.attrs.atomRefs2 ?? "").split(/\s+/).filter(Boolean)
      if (refs.length !== 2) {
        issues.push({ code: "bad-bond", severity: "error", message: "bond needs atomRefs2 with two atom ids", line: tag.line })
      } else {
        for (const ref of refs) {
          if (!atoms.has(ref)) issues.push({ code: "missing-atom", severity: "error", message: `bond references unknown atom ${ref}`, line: tag.line })
        }
      }
      records.push({ id: `bond:${bondCount}`, kind: "bond", fields: { refs: refs.join(" "), order: tag.attrs.order ?? "", line: tag.line } })
    }
  }

  if (local(root) !== "cml") {
    issues.push({ code: "bad-root", severity: "error", message: `Root must be cml, found ${root || "nothing"}` })
  }
  if (molecules.size === 0) issues.push({ code: "no-molecules", severity: "error", message: "File has no molecule" })
  if (atomCount === 0) issues.push({ code: "no-atoms", severity: "error", message: "File has no atom" })
  if (bondCount === 0) issues.push({ code: "no-bonds", severity: "warning", message: "File has no bond" })

  return {
    format: "CML",
    records,
    meta: { molecules: molecules.size, atoms: atomCount, bonds: bondCount },
    issues,
  }
}

const reference = [
  "Chemical Markup Language (CML)",
  "",
  '<cml xmlns="http://www.xml-cml.org/schema">',
  '  <molecule id="m1">',
  '    <atom id="a1" elementType="C" x3="0" y3="0" z3="0"/>',
  '    <atom id="a2" elementType="O" x3="1" y3="0" z3="0"/>',
  '    <bond atomRefs2="a1 a2" order="2"/>',
  "  </molecule>",
  "</cml>",
  "",
  "Root is cml.",
  "Atoms need unique ids and an elementType.",
  "Bonds reference two existing atoms.",
].join("\n")

export const format: FormatModule = {
  slug: "cml",
  displayName: "CML",
  extensions: [".cml"],
  description: "Parse CML molecules, validate atoms, bonds and element types.",
  reference,
  parse,
  sample: () =>
    [
      '<?xml version="1.0"?>',
      '<cml xmlns="http://www.xml-cml.org/schema">',
      '  <molecule id="m1">',
      '    <atom id="a1" elementType="C" x3="0" y3="0" z3="0"/>',
      '    <atom id="a2" elementType="O" x3="1" y3="0" z3="0"/>',
      '    <bond atomRefs2="a1 a2" order="2"/>',
      "  </molecule>",
      "</cml>",
    ].join("\n") + "\n",
}
