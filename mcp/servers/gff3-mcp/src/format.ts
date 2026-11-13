import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const lines = text.split(/\r?\n/)
  let version = false
  let features = 0
  const types: Record<string, number> = {}

  for (const [index, raw] of lines.entries()) {
    const line = raw.trimEnd()
    const lineNo = index + 1
    if (!line || line.startsWith("#")) {
      if (line.startsWith("##gff-version")) version = /^##gff-version\s+3/.test(line)
      continue
    }
    const cols = line.split("\t")
    if (cols.length !== 9) {
      issues.push({ code: "bad-columns", severity: "error", message: `GFF3 needs 9 tab-separated columns, found ${cols.length}`, line: lineNo })
      continue
    }
    const [seqid, source, type, startRaw, endRaw, score, strand, phase, attrs] = cols
    const start = Number(startRaw)
    const end = Number(endRaw)
    if (!seqid || !source || !type) issues.push({ code: "empty-column", severity: "error", message: "seqid, source and type are required", line: lineNo })
    if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end < start) {
      issues.push({ code: "bad-range", severity: "error", message: `Bad start/end: ${startRaw}..${endRaw}`, line: lineNo })
    }
    if (score !== "." && !Number.isFinite(Number(score))) issues.push({ code: "bad-score", severity: "error", message: `Score must be numeric or .: ${score}`, line: lineNo })
    if (!["+", "-", ".", "?"].includes(strand)) issues.push({ code: "bad-strand", severity: "error", message: `Bad strand: ${strand}`, line: lineNo })
    if (!["0", "1", "2", "."].includes(phase)) issues.push({ code: "bad-phase", severity: "error", message: `Phase must be 0, 1, 2 or .: ${phase}`, line: lineNo })
    for (const part of attrs.split(";")) {
      if (part && !/^[^\s=]+=.+/.test(part)) issues.push({ code: "bad-attributes", severity: "error", message: `Bad attribute: ${part}`, line: lineNo })
    }
    features += 1
    types[type] = (types[type] ?? 0) + 1
    records.push({ id: attrs.match(/(?:^|;)ID=([^;]+)/)?.[1] ?? `feature:${features}`, kind: type, fields: { seqid, start, end, strand, phase, line: lineNo } })
  }

  if (!version) issues.push({ code: "no-version", severity: "error", message: "Missing ##gff-version 3 directive" })
  if (features === 0) issues.push({ code: "no-features", severity: "error", message: "File has no feature lines" })

  return { format: "GFF3", records, meta: { features, types: Object.keys(types).length }, issues }
}

const reference = [
  "GFF3 gene annotation",
  "",
  "##gff-version 3",
  "chr1\tdemo\tgene\t1\t1000\t.\t+\t.\tID=gene1;Name=DEMO1",
  "chr1\tdemo\tmRNA\t1\t900\t.\t+\t.\tID=tx1;Parent=gene1",
  "",
  "Nine tab-separated columns: seqid, source, type, start, end, score, strand, phase, attributes.",
  "Coordinates are 1-based and start must not pass end.",
  "Attributes are key=value pairs separated by semicolons.",
].join("\n")

export const format: FormatModule = {
  slug: "gff3",
  displayName: "GFF3",
  extensions: [".gff3", ".gff"],
  description: "Parse GFF3 annotations, validate columns, ranges, strands and attributes.",
  reference,
  parse,
  sample: () =>
    [
      "##gff-version 3",
      "chr1\tdemo\tgene\t1\t1000\t.\t+\t.\tID=gene1;Name=DEMO1",
      "chr1\tdemo\tmRNA\t1\t900\t.\t+\t.\tID=tx1;Parent=gene1",
      "chr1\tdemo\texon\t1\t200\t.\t+\t.\tID=exon1;Parent=tx1",
      "chr1\tdemo\texon\t400\t900\t.\t+\t.\tID=exon2;Parent=tx1",
    ].join("\n") + "\n",
}
