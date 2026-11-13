import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0)
  if (lines.length === 0) {
    return { format: "PHYLIP", records, meta: { taxa: 0, sites: 0 }, issues: [{ code: "empty", severity: "error", message: "File is empty" }] }
  }

  const header = /^\s*(\d+)\s+(\d+)\s*$/.exec(lines[0])
  if (!header) {
    return { format: "PHYLIP", records, meta: { taxa: 0, sites: 0 }, issues: [{ code: "bad-header", severity: "error", message: "First line must contain number of taxa and sites" }] }
  }
  const taxa = Number(header[1])
  const sites = Number(header[2])
  const names = new Set<string>()
  let found = 0

  for (const [index, line] of lines.slice(1).entries()) {
    const lineNo = index + 2
    const name = line.slice(0, 10).trim()
    const sequence = line.slice(10).replace(/\s/g, "")
    if (!name) {
      issues.push({ code: "no-name", severity: "error", message: "Sequence line has no name", line: lineNo })
      continue
    }
    if (names.has(name)) issues.push({ code: "duplicate-name", severity: "error", message: `Taxon ${name} appears twice`, line: lineNo })
    names.add(name)
    if (sequence.length !== sites) {
      issues.push({ code: "bad-length", severity: "error", message: `${name} has ${sequence.length} sites, header says ${sites}`, line: lineNo })
    }
    if (!/^[A-Za-z?*-]+$/.test(sequence)) {
      issues.push({ code: "bad-residue", severity: "warning", message: `${name} has unexpected characters`, line: lineNo })
    }
    found += 1
    records.push({ id: `taxon:${name}`, kind: "taxon", fields: { name, sites: sequence.length, line: lineNo } })
  }

  if (found !== taxa) issues.push({ code: "bad-taxa", severity: "error", message: `Header says ${taxa} taxa, found ${found}` })

  return {
    format: "PHYLIP",
    records,
    meta: { taxa: found, sites },
    issues,
  }
}

const reference = [
  "PHYLIP sequence alignment",
  "",
  " 4 8",
  "Alpha     ACGTACGT",
  "Beta      ACGTTCGT",
  "Gamma     ACGTACGA",
  "Delta     ACGTACGG",
  "",
  "The first line is the number of taxa and sites.",
  "Each taxon name takes 10 columns, then the sequence.",
  "Every sequence must match the declared site count.",
].join("\n")

export const format: FormatModule = {
  slug: "phylip",
  displayName: "PHYLIP",
  extensions: [".phy", ".phylip"],
  description: "Parse PHYLIP alignments, validate taxa, site counts and names.",
  reference,
  parse,
  sample: () =>
    [
      " 4 8",
      "Alpha     ACGTACGT",
      "Beta      ACGTTCGT",
      "Gamma     ACGTACGA",
      "Delta     ACGTACGG",
    ].join("\n") + "\n",
}
