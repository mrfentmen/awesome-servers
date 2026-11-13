import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

const ELEMENT = /^[A-Z][a-z]?$/

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0)
  let declared = -1
  let atoms = 0

  if (lines.length === 0) {
    return { format: "XYZ", records, meta: { atoms: 0 }, issues: [{ code: "empty", severity: "error", message: "Document is empty" }] }
  }

  const header = Number(lines[0].trim())
  if (!Number.isInteger(header) || header <= 0) {
    issues.push({ code: "bad-count", severity: "error", message: `First line must be an atom count: ${lines[0].trim()}`, line: 1 })
  } else {
    declared = header
  }

  for (let index = 2; index < lines.length; index++) {
    const lineNo = index + 1
    const parts = lines[index].trim().split(/\s+/)
    if (parts.length !== 4) {
      issues.push({ code: "bad-atom", severity: "error", message: `Atom line needs element and x y z, found ${parts.length} fields`, line: lineNo })
      continue
    }
    const element = parts[0]
    if (!ELEMENT.test(element)) issues.push({ code: "bad-element", severity: "error", message: `Bad element symbol: ${element}`, line: lineNo })
    const coords = parts.slice(1).map(Number)
    if (coords.some((value) => !Number.isFinite(value))) {
      issues.push({ code: "bad-coordinates", severity: "error", message: "Coordinates must be numbers", line: lineNo })
    }
    atoms += 1
    records.push({ id: `atom:${atoms}`, kind: "atom", fields: { element, x: coords[0] ?? null, y: coords[1] ?? null, z: coords[2] ?? null, line: lineNo } })
  }

  if (declared >= 0 && declared !== atoms) issues.push({ code: "atom-count", severity: "error", message: `Header says ${declared} atoms, found ${atoms}` })
  if (atoms === 0) issues.push({ code: "no-atoms", severity: "error", message: "File has no atoms" })

  return { format: "XYZ", records, meta: { atoms, declared }, issues }
}

const reference = [
  "XYZ molecular coordinates",
  "",
  "3",
  "water",
  "O 0.0000 0.0000 0.0000",
  "H 0.9572 0.0000 0.0000",
  "H -0.2400 0.9266 0.0000",
  "",
  "Line 1 is the atom count.",
  "Line 2 is a comment.",
  "Every atom line is element x y z.",
].join("\n")

export const format: FormatModule = {
  slug: "xyz",
  displayName: "XYZ",
  extensions: [".xyz"],
  description: "Parse XYZ molecules, validate atom counts, elements and coordinates.",
  reference,
  parse,
  sample: () =>
    ["3", "water", "O 0.0000 0.0000 0.0000", "H 0.9572 0.0000 0.0000", "H -0.2400 0.9266 0.0000"].join("\n") + "\n",
}
