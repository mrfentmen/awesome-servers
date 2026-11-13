import type { FormatModule, Issue, Parsed, ParsedRecord } from "./types.js"

const FLAGS: Array<[number, string]> = [
  [0x1, "paired"],
  [0x2, "proper_pair"],
  [0x4, "unmapped"],
  [0x8, "mate_unmapped"],
  [0x10, "reverse"],
  [0x20, "mate_reverse"],
  [0x40, "first"],
  [0x80, "second"],
  [0x100, "secondary"],
  [0x200, "qc_fail"],
  [0x400, "duplicate"],
  [0x800, "supplementary"],
]

function decodeFlag(flag: number): string {
  return FLAGS.filter(([bit]) => (flag & bit) !== 0)
    .map(([, name]) => name)
    .join(",")
}

function decodeCigar(cigar: string): { length: number; ops: string } | null {
  if (cigar === "*") return null
  if (!/^(\d+[MIDNSHP=X])+$/.test(cigar)) return null
  const ops: string[] = []
  let length = 0
  for (const match of cigar.matchAll(/(\d+)([MIDNSHP=X])/g)) {
    const size = Number(match[1])
    length += size
    ops.push(`${match[1]}${match[2]}`)
  }
  return { length, ops: ops.join(" ") }
}

function parse(text: string): Parsed {
  const issues: Issue[] = []
  const records: ParsedRecord[] = []
  const meta: Parsed["meta"] = {}
  const references = new Set<string>()
  let alignments = 0
  let mapped = 0
  let unmapped = 0

  text.split(/\r?\n/).forEach((line, index) => {
    const number = index + 1
    if (line.trim().length === 0) return

    if (line.startsWith("@")) {
      const fields = line.split("\t")
      const type = fields[0].slice(1)
      if (type === "SQ") {
        const sn = fields.find((part) => part.startsWith("SN:"))
        if (sn) references.add(sn.slice(3))
      }
      records.push({
        id: `${type}-${number}`,
        kind: "header",
        fields: { type, fields: fields.length, raw: line },
      })
      return
    }

    const cells = line.split("\t")
    if (cells.length < 11) {
      issues.push({
        code: "short-alignment",
        severity: "error",
        message: `Alignment needs at least 11 fields, found ${cells.length}`,
        line: number,
      })
      return
    }

    const [qname, flagText, rname, posText, mapqText, cigar, , , , seq, qual] = cells
    const flag = Number(flagText)
    const pos = Number(posText)
    const mapq = Number(mapqText)

    if (!Number.isInteger(flag) || flag < 0) {
      issues.push({ code: "bad-flag", severity: "error", message: `FLAG must be an integer, got ${flagText}`, line: number })
    }
    if (!Number.isInteger(pos) || pos < 0) {
      issues.push({ code: "bad-pos", severity: "error", message: `POS must be an integer, got ${posText}`, line: number })
    }
    if (!Number.isInteger(mapq) || mapq < 0 || mapq > 255) {
      issues.push({ code: "bad-mapq", severity: "error", message: `MAPQ must be 0-255, got ${mapqText}`, line: number })
    }

    const decoded = decodeCigar(cigar)
    if (cigar !== "*" && decoded === null) {
      issues.push({ code: "bad-cigar", severity: "error", message: `CIGAR is malformed: ${cigar}`, line: number })
    }

    if (seq !== "*" && qual !== "*" && seq.length !== qual.length) {
      issues.push({
        code: "seq-qual-length",
        severity: "error",
        message: `SEQ length ${seq.length} does not match QUAL length ${qual.length}`,
        line: number,
      })
    }

    const isUnmapped = (flag & 0x4) !== 0
    alignments += 1
    if (isUnmapped) unmapped += 1
    else mapped += 1

    records.push({
      id: `${qname}#${number}`,
      kind: "alignment",
      fields: {
        qname,
        flag: Number.isFinite(flag) ? flag : 0,
        flagNames: decodeFlag(Number.isFinite(flag) ? flag : 0),
        rname,
        pos: Number.isFinite(pos) ? pos : 0,
        mapq: Number.isFinite(mapq) ? mapq : 0,
        cigar,
        cigarLength: decoded?.length ?? 0,
        seqLength: seq === "*" ? 0 : seq.length,
        unmapped: isUnmapped,
      },
    })
  })

  meta.alignments = alignments
  meta.mapped = mapped
  meta.unmapped = unmapped
  meta.references = references.size
  meta.mappingRate = alignments > 0 ? Math.round((mapped / alignments) * 1000) / 1000 : 0

  return { format: "SAM", records, meta, issues }
}

const reference = [
  "SAM alignment format",
  "",
  "Header lines start with @ (@HD, @SQ, @RG, @PG, @CO).",
  "Alignment lines have 11 mandatory tab separated fields:",
  "  QNAME FLAG RNAME POS MAPQ CIGAR RNEXT PNEXT TLEN SEQ QUAL",
  "FLAG is a bit field: 0x4 means unmapped, 0x10 reverse strand, 0x400 duplicate.",
  "CIGAR operators: M I D N S H P = X. Example 10M2I5M.",
  "SEQ and QUAL must be the same length unless QUAL is *.",
  "BAM is the binary form of SAM. This server reads the text SAM form.",
].join("\n")

export const format: FormatModule = {
  slug: "sam-bam",
  displayName: "SAM",
  extensions: [".sam"],
  description: "Parse SAM alignments, decode FLAG and CIGAR, validate fields.",
  reference,
  parse,
  sample: () =>
    [
      "@HD\tVN:1.6\tSO:coordinate",
      "@SQ\tSN:chr1\tLN:1000",
      "read1\t0\tchr1\t100\t60\t10M\t*\t0\t0\tACGTACGTAC\tIIIIIIIIII",
      "read2\t16\tchr1\t200\t0\t5M1I4M\t*\t0\t0\tACGTACGTAC\tIIIIIIIIII",
    ].join("\n") + "\n",
}
