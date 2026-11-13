import type { FormatModule, Issue, Parsed, ParsedRecord } from "./types.js"

function parse(text: string): Parsed {
  const issues: Issue[] = []
  const records: ParsedRecord[] = []
  const meta: Parsed["meta"] = {}
  const lines = text.split(/\r?\n/)

  if (!/^\s*#NEXUS/i.test(text)) {
    issues.push({ code: "missing-header", severity: "error", message: "NEXUS file must start with #NEXUS", line: 1 })
  }

  let block: string | null = null
  let blockLine = 0
  let inMatrix = false
  let declaredTaxa: number | null = null
  let declaredChars: number | null = null
  const taxa: string[] = []
  const matrix: Array<{ taxon: string; sequence: string; line: number }> = []

  lines.forEach((raw, index) => {
    const number = index + 1
    const line = raw.replace(/\[[^\]]*\]/g, "").trim()
    if (line.length === 0) return

    if (inMatrix) {
      if (line === ";") {
        inMatrix = false
        return
      }
      const cells = line.split(/\s+/)
      if (cells.length < 2) {
        issues.push({ code: "bad-matrix-row", severity: "error", message: `Matrix row needs a taxon and a sequence: ${line}`, line: number })
        return
      }
      const [taxon, ...parts] = cells
      const sequence = parts.join("")
      matrix.push({ taxon, sequence, line: number })
      if (!taxa.includes(taxon)) taxa.push(taxon)
      records.push({
        id: `matrix:${taxon}`,
        kind: "sequence",
        fields: { taxon, sequence, length: sequence.length },
      })
      return
    }

    const begin = /^begin\s+([a-z]+)\s*;/i.exec(line)
    if (begin) {
      if (block) {
        issues.push({
          code: "nested-block",
          severity: "error",
          message: `Block ${begin[1]} starts inside ${block}`,
          line: number,
        })
      }
      block = begin[1].toLowerCase()
      blockLine = number
      records.push({ id: `block:${block}`, kind: "block", fields: { name: block, line: number } })
      return
    }

    if (/^end\s*;/i.test(line)) {
      if (!block) {
        issues.push({ code: "stray-end", severity: "error", message: "end; without a matching begin", line: number })
      }
      block = null
      return
    }

    const dimensions = /^dimensions\s+(.+);$/i.exec(line)
    if (dimensions) {
      const ntax = /ntax\s*=\s*(\d+)/i.exec(dimensions[1])
      const nchar = /nchar\s*=\s*(\d+)/i.exec(dimensions[1])
      if (ntax) declaredTaxa = Number(ntax[1])
      if (nchar) declaredChars = Number(nchar[1])
      return
    }

    const taxLabels = /^taxlabels\s+(.+);$/i.exec(line)
    if (taxLabels) {
      for (const label of taxLabels[1].split(/\s+/)) {
        if (label === ";") continue
        if (!taxa.includes(label)) taxa.push(label)
        records.push({ id: `taxon:${label}`, kind: "taxon", fields: { label } })
      }
      return
    }

    const matrixStart = /^matrix\b/i.exec(line)
    if (matrixStart) {
      inMatrix = true
      return
    }
  })

  if (inMatrix) {
    issues.push({ code: "unclosed-matrix", severity: "error", message: "Matrix block is not closed with ;" })
  }
  if (block) {
    issues.push({ code: "unclosed-block", severity: "error", message: `Block ${block} opened at line ${blockLine} has no end;` })
  }
  if (declaredTaxa !== null && taxa.length !== declaredTaxa) {
    issues.push({
      code: "taxa-mismatch",
      severity: "warning",
      message: `dimensions ntax=${declaredTaxa} but ${taxa.length} taxa were read`,
    })
  }
  const lengths = new Set(matrix.map((row) => row.sequence.length))
  if (lengths.size > 1) {
    issues.push({ code: "ragged-matrix", severity: "error", message: `Matrix rows have different lengths: ${[...lengths].join(", ")}` })
  }
  if (declaredChars !== null && lengths.size === 1 && [...lengths][0] !== declaredChars) {
    issues.push({
      code: "nchar-mismatch",
      severity: "error",
      message: `dimensions nchar=${declaredChars} but rows are ${[...lengths][0]} characters`,
    })
  }

  meta.taxa = taxa.length
  meta.declaredTaxa = declaredTaxa
  meta.sequences = matrix.length
  meta.sequenceLength = lengths.size === 1 ? [...lengths][0] : 0

  return { format: "NEXUS", records, meta, issues }
}

const reference = [
  "NEXUS alignment format",
  "",
  "#NEXUS must be the first line.",
  "Blocks: begin <name>; ... end;",
  "  taxa block        dimensions ntax=2; taxlabels A B;",
  "  characters block  dimensions nchar=4; format datatype=dna; matrix ... ;",
  "Matrix rows are a taxon name followed by the sequence characters.",
  "Every matrix row must be the same length, and match nchar.",
  "Text inside square brackets is a comment.",
].join("\n")

export const format: FormatModule = {
  slug: "nexus-phylo",
  displayName: "NEXUS",
  extensions: [".nex", ".nexus", ".nxs"],
  description: "Parse NEXUS blocks, taxa and matrices, validate alignment rows.",
  reference,
  parse,
  sample: () =>
    [
      "#NEXUS",
      "begin taxa;",
      "  dimensions ntax=2;",
      "  taxlabels A B;",
      "end;",
      "begin characters;",
      "  dimensions nchar=4;",
      "  format datatype=dna missing=?;",
      "  matrix",
      "    A ACGT",
      "    B ACGA",
      "  ;",
      "end;",
    ].join("\n") + "\n",
}
