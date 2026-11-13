import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

const BOND_TYPES = new Set(["1", "2", "3", "ar", "am", "du", "un", "nc"])

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const lines = text.split(/\r?\n/)
  let section = ""
  let name = ""
  let declaredAtoms = -1
  let declaredBonds = -1
  let atoms = 0
  let bonds = 0
  let header = false

  const atomIds = new Set<number>()

  for (const [index, raw] of lines.entries()) {
    const line = raw.trim()
    const lineNo = index + 1
    if (line.startsWith("@<TRIPOS>")) {
      section = line.slice(9).toUpperCase()
      if (section === "MOLECULE") {
        header = true
        name = ""
      }
      continue
    }
    if (!line) continue
    if (section === "MOLECULE") {
      if (!name) {
        name = line
        continue
      }
      if (declaredAtoms < 0) {
        const counts = /^(\d+)\s+(\d+)/.exec(line)
        if (!counts) {
          issues.push({ code: "bad-counts", severity: "error", message: "Molecule line must contain atom and bond counts", line: lineNo })
        } else {
          declaredAtoms = Number(counts[1])
          declaredBonds = Number(counts[2])
        }
      }
      continue
    }
    if (section === "ATOM") {
      const parts = line.split(/\s+/)
      if (parts.length < 6) {
        issues.push({ code: "bad-atom", severity: "error", message: "Atom line has fewer than 6 fields", line: lineNo })
        continue
      }
      const id = Number(parts[0])
      if (!Number.isInteger(id) || id <= 0) {
        issues.push({ code: "bad-atom-id", severity: "error", message: `Atom id must be a positive integer: ${parts[0]}`, line: lineNo })
      } else {
        atomIds.add(id)
      }
      const x = Number(parts[2])
      const y = Number(parts[3])
      const z = Number(parts[4])
      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
        issues.push({ code: "bad-coordinates", severity: "error", message: `Atom ${parts[0]} has non-numeric coordinates`, line: lineNo })
      }
      atoms += 1
      records.push({ id: `atom:${parts[0] ?? atoms}`, kind: "atom", fields: { name: parts[1] ?? "", type: parts[5] ?? "", line: lineNo } })
      continue
    }
    if (section === "BOND") {
      const parts = line.split(/\s+/)
      if (parts.length < 4) {
        issues.push({ code: "bad-bond", severity: "error", message: "Bond line has fewer than 4 fields", line: lineNo })
        continue
      }
      const a1 = Number(parts[1])
      const a2 = Number(parts[2])
      if (!atomIds.has(a1) || !atomIds.has(a2)) {
        issues.push({ code: "bond-index", severity: "error", message: `Bond references atom ids ${parts[1]}, ${parts[2]} outside the atom list`, line: lineNo })
      }
      const type = parts[3]
      if (!BOND_TYPES.has(type)) issues.push({ code: "bad-bond-type", severity: "error", message: `Unknown bond type: ${type}`, line: lineNo })
      bonds += 1
      records.push({ id: `bond:${parts[0] ?? bonds}`, kind: "bond", fields: { from: parts[1] ?? "", to: parts[2] ?? "", type, line: lineNo } })
    }
  }

  if (!header) issues.push({ code: "no-header", severity: "error", message: "File has no @<TRIPOS>MOLECULE section" })
  if (!name) issues.push({ code: "no-name", severity: "error", message: "Molecule has no name" })
  if (declaredAtoms < 0) issues.push({ code: "no-counts", severity: "error", message: "Molecule has no counts line" })
  if (declaredAtoms >= 0 && declaredAtoms !== atoms) {
    issues.push({ code: "atom-count", severity: "error", message: `Header says ${declaredAtoms} atoms, found ${atoms}` })
  }
  if (declaredBonds >= 0 && declaredBonds !== bonds) {
    issues.push({ code: "bond-count", severity: "error", message: `Header says ${declaredBonds} bonds, found ${bonds}` })
  }
  if (atoms === 0) issues.push({ code: "no-atoms", severity: "error", message: "Molecule has no atoms" })

  return {
    format: "MOL2",
    records,
    meta: { name, atoms, bonds, declaredAtoms, declaredBonds },
    issues,
  }
}

const reference = [
  "Tripos MOL2 molecule",
  "",
  "@<TRIPOS>MOLECULE",
  "water",
  " 3 2 0 0 0",
  "SMALL",
  "NO_CHARGES",
  "",
  "@<TRIPOS>ATOM",
  "      1 O1  0.0000 0.0000 0.0000 O.3 1 WAT 0.0000",
  "      2 H1  0.9572 0.0000 0.0000 H   1 WAT 0.0000",
  "      3 H2 -0.2400 0.9266 0.0000 H   1 WAT 0.0000",
  "@<TRIPOS>BOND",
  "     1 1 2 1",
  "     2 1 3 1",
  "",
  "The molecule name comes after MOLECULE.",
  "The next line holds atom and bond counts.",
  "Bond atom indices must exist in the atom list.",
].join("\n")

export const format: FormatModule = {
  slug: "mol2",
  displayName: "MOL2",
  extensions: [".mol2"],
  description: "Parse MOL2 molecules, validate atoms, coordinates, bonds and counts.",
  reference,
  parse,
  sample: () =>
    [
      "@<TRIPOS>MOLECULE",
      "water",
      " 3 2 0 0 0",
      "SMALL",
      "NO_CHARGES",
      "",
      "@<TRIPOS>ATOM",
      "      1 O1  0.0000 0.0000 0.0000 O.3 1 WAT 0.0000",
      "      2 H1  0.9572 0.0000 0.0000 H   1 WAT 0.0000",
      "      3 H2 -0.2400 0.9266 0.0000 H   1 WAT 0.0000",
      "@<TRIPOS>BOND",
      "     1 1 2 1",
      "     2 1 3 1",
    ].join("\n") + "\n",
}
