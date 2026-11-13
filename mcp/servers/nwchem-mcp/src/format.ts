import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

const BLOCKS = new Set(["geometry", "basis", "ecp", "scf", "dft", "mp2", "ccsd", "tddft", "freq", "constraints", "end"])

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  let block: { name: string; line: number; atoms: number } | null = null
  const currentBlock = (): { name: string; line: number; atoms: number } | null => block
  let hasStart = false
  let hasTask = false
  let geometryAtoms = 0

  text.split(/\r?\n/).forEach((raw, index) => {
    const number = index + 1
    const line = raw.replace(/#.*$/, "").trim()
    if (line.length === 0) return
    const tokens = line.split(/\s+/)
    const directive = tokens[0].toLowerCase()

    if (directive === "start") {
      hasStart = true
      records.push({ id: `start:${number}`, kind: "start", fields: { name: tokens[1] ?? "" } })
      return
    }

    if (directive === "task") {
      hasTask = true
      if (tokens.length < 2) {
        issues.push({ code: "empty-task", severity: "error", message: "task needs a module, for example task scf optimize", line: number })
      }
      records.push({ id: `task:${number}`, kind: "task", fields: { module: tokens[1] ?? "", action: tokens[2] ?? "", line: number } })
      return
    }

    if (BLOCKS.has(directive) && directive !== "end") {
      if (block) {
        issues.push({ code: "unterminated-block", severity: "error", message: `${block.name} opened at line ${block.line} has no end`, line: block.line })
      }
      block = { name: directive, line: number, atoms: 0 }
      records.push({ id: `block:${directive}:${number}`, kind: "block", fields: { name: directive, line: number } })
      return
    }

    if (directive === "end") {
      if (!block) {
        issues.push({ code: "stray-end", severity: "error", message: "end without an open block", line: number })
        return
      }
      if (block.name === "geometry" && block.atoms === 0) {
        issues.push({ code: "empty-geometry", severity: "error", message: "geometry block has no atoms", line: block.line })
      }
      if (block.name === "geometry") geometryAtoms = block.atoms
      block = null
      return
    }

    if (block) {
      if (block.name === "geometry") {
        const match = /^([A-Za-z]{1,3})\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)$/.exec(line)
        if (!match) {
          issues.push({ code: "bad-atom", severity: "error", message: `Geometry row must be element x y z: ${line.slice(0, 40)}`, line: number })
          return
        }
        block.atoms += 1
        records.push({ id: `atom:${number}`, kind: "atom", fields: { element: match[1], x: Number(match[2]), y: Number(match[3]), z: Number(match[4]) } })
        return
      }
      records.push({ id: `entry:${number}`, kind: "entry", fields: { block: block.name, value: line.slice(0, 120) } })
    }
  })

  const openBlock = currentBlock()
  if (openBlock) {
    issues.push({ code: "unterminated-block", severity: "error", message: `${openBlock.name} opened at line ${openBlock.line} has no end`, line: openBlock.line })
  }
  if (!hasStart) issues.push({ code: "no-start", severity: "warning", message: "Input has no start directive" })
  if (!hasTask) issues.push({ code: "no-task", severity: "error", message: "Input has no task directive" })

  return {
    format: "NWChem",
    records,
    meta: {
      blocks: records.filter((record) => record.kind === "block").length,
      geometryAtoms,
      tasks: records.filter((record) => record.kind === "task").length,
      hasStart,
    },
    issues,
  }
}

const reference = [
  "NWChem input",
  "",
  "start demo",
  "geometry units angstroms",
  "  O 0.0 0.0 0.0",
  "  H 0.75 0.5 0.0",
  "end",
  "basis",
  "  * library 6-31g*",
  "end",
  "task scf optimize",
  "",
  "Blocks open with a name and close with end.",
  "geometry rows are element and three coordinates.",
  "task names the module and optional action.",
].join("\n")

export const format: FormatModule = {
  slug: "nwchem",
  displayName: "NWChem",
  extensions: [".nw", ".nwchem", ".in"],
  description: "Parse NWChem inputs, validate blocks, geometry and task lines.",
  reference,
  parse,
  sample: () =>
    [
      "start demo",
      "geometry units angstroms",
      "  O 0.0 0.0 0.0",
      "  H 0.75 0.5 0.0",
      "end",
      "basis",
      "  * library 6-31g*",
      "end",
      "task scf optimize",
    ].join("\n") + "\n",
}
