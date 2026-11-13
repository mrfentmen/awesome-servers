import type { FormatModule, Issue, Parsed, ParsedRecord } from "./types.js"

const BASES = /^[ACGTNacgtn*.<>]+$/

function parse(text: string): Parsed {
  const issues: Issue[] = []
  const records: ParsedRecord[] = []
  const meta: Parsed["meta"] = {}
  const lines = text.split(/\r?\n/)

  let headerColumns: string[] | null = null
  let sawFileFormat = false
  let variantCount = 0
  const contigs = new Set<string>()

  lines.forEach((line, index) => {
    const number = index + 1
    if (line.trim().length === 0) return

    if (line.startsWith("##")) {
      const body = line.slice(2)
      const eq = body.indexOf("=")
      if (eq === -1) {
        issues.push({ code: "bad-meta", severity: "warning", message: `Header line has no = : ${body}`, line: number })
        return
      }
      const key = body.slice(0, eq)
      const value = body.slice(eq + 1)
      if (key === "fileformat") {
        sawFileFormat = true
        meta.fileformat = value
        if (!/^VCFv\d+\.\d+$/.test(value)) {
          issues.push({
            code: "bad-fileformat",
            severity: "warning",
            message: `fileformat should look like VCFv4.2, got ${value}`,
            line: number,
          })
        }
      }
      if (key === "contig") contigs.add(value.split(",")[0] ?? value)
      if (key === "reference") meta.reference = value
      return
    }

    if (line.startsWith("#")) {
      const columns = line.slice(1).split("\t")
      headerColumns = columns
      meta.columns = columns.length
      meta.samples = Math.max(0, columns.length - 9)
      if (columns[0] !== "CHROM") {
        issues.push({ code: "bad-columns", severity: "error", message: "Column header must start with #CHROM", line: number })
      }
      if (columns.length < 8) {
        issues.push({
          code: "short-header",
          severity: "error",
          message: `Header has ${columns.length} columns, at least 8 are required`,
          line: number,
        })
      }
      return
    }

    if (!headerColumns) {
      issues.push({ code: "no-header", severity: "error", message: "Data line appears before the #CHROM header", line: number })
      return
    }

    const cells = line.split("\t")
    if (cells.length !== headerColumns.length) {
      issues.push({
        code: "column-count",
        severity: "error",
        message: `Expected ${headerColumns.length} columns, found ${cells.length}`,
        line: number,
      })
    }

    const [chrom, pos, id, ref, alt, qual, filter, info] = cells
    if (!chrom) issues.push({ code: "missing-chrom", severity: "error", message: "CHROM is empty", line: number })

    const position = Number(pos)
    if (!Number.isInteger(position) || position < 1) {
      issues.push({ code: "bad-pos", severity: "error", message: `POS must be a positive integer, got ${pos}`, line: number })
    }

    if (!ref || !BASES.test(ref)) {
      issues.push({ code: "bad-ref", severity: "error", message: `REF is not a nucleotide string: ${ref}`, line: number })
    }
    if (!alt || !BASES.test(alt)) {
      issues.push({ code: "bad-alt", severity: "error", message: `ALT is not a nucleotide string: ${alt}`, line: number })
    }

    if (qual !== "." && !Number.isFinite(Number(qual))) {
      issues.push({ code: "bad-qual", severity: "error", message: `QUAL must be numeric or ., got ${qual}`, line: number })
    }

    if (info && info !== "." && !/^[A-Za-z_][A-Za-z0-9_.-]*(=[^;]*)?(;[A-Za-z_][A-Za-z0-9_.-]*(=[^;]*)?)*$/.test(info)) {
      issues.push({ code: "bad-info", severity: "warning", message: `INFO is not a key=value list: ${info}`, line: number })
    }

    const depth = /(?:^|;)DP=(\d+)/.exec(info ?? "")
    variantCount += 1
    records.push({
      id: `${chrom}:${pos}${id && id !== "." ? `:${id}` : ""}`,
      kind: "variant",
      fields: {
        chrom: chrom ?? "",
        pos: Number.isFinite(position) ? position : 0,
        id: id ?? ".",
        ref: ref ?? "",
        alt: alt ?? "",
        qual: qual === "." || qual === undefined ? null : Number(qual),
        filter: filter ?? ".",
        info: info ?? ".",
        depth: depth ? Number(depth[1]) : null,
      },
    })
  })

  if (!sawFileFormat) {
    issues.push({ code: "missing-fileformat", severity: "error", message: "Missing ##fileformat header line", line: 1 })
  }
  if (!headerColumns) {
    issues.push({ code: "missing-columns", severity: "error", message: "Missing #CHROM column header line" })
  }

  meta.variants = variantCount
  meta.contigs = contigs.size
  meta.pass = records.filter((record) => record.fields.filter === "PASS").length

  return { format: "VCF", records, meta, issues }
}

const reference = [
  "VCF variant call format",
  "",
  "##fileformat=VCFv4.2 must be the first line.",
  "## key=value lines carry metadata (contig, reference, INFO and FORMAT definitions).",
  "#CHROM POS ID REF ALT QUAL FILTER INFO [FORMAT sample...] is the column header.",
  "Data rows are tab separated and must match the header column count.",
  "POS is 1-based. REF and ALT are nucleotide strings. QUAL is a number or a dot.",
  "INFO is a semicolon separated key=value list, or a dot when empty.",
].join("\n")

export const format: FormatModule = {
  slug: "vcf-variants",
  displayName: "VCF",
  extensions: [".vcf"],
  description: "Parse VCF variant records, validate columns and summarize genotypes.",
  reference,
  parse,
  sample: () =>
    [
      "##fileformat=VCFv4.2",
      "##source=vcf-variants-mcp",
      "#CHROM\tPOS\tID\tREF\tALT\tQUAL\tFILTER\tINFO",
      "1\t100\t.\tA\tG\t50\tPASS\tDP=10",
      "1\t200\trs1\tC\tT\t99\tPASS\tDP=22;AF=0.5",
    ].join("\n") + "\n",
}
