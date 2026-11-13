import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

const SINGLE_LINE = new Set(["maxcore"])

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const methods: string[] = []
  let block: { name: string; line: number } | null = null
  const currentBlock = (): { name: string; line: number } | null => block
  let coords: { charge: string; mult: string; line: number; rows: number } | null = null
  const currentCoords = (): { charge: string; mult: string; line: number; rows: number } | null => coords
  let sawSimple = false

  text.split(/\r?\n/).forEach((raw, index) => {
    const number = index + 1
    const line = raw.replace(/#.*$/, "").trim()
    if (line.length === 0) return

    if (line.startsWith("!")) {
      sawSimple = true
      const keywords = line.slice(1).trim().split(/\s+/).filter(Boolean)
      methods.push(...keywords)
      records.push({ id: `simple:${number}`, kind: "method", fields: { keywords: keywords.join(" "), line: number } })
      return
    }

    const percent = /^%([A-Za-z_]\w*)(?:\s+(.*))?$/.exec(line)
    if (percent) {
      if (block) {
        issues.push({ code: "unterminated-block", severity: "error", message: `%${block.name} opened at line ${block.line} has no end`, line: block.line })
      }
      block = { name: percent[1], line: number }
      const inline = (percent[2] ?? "").trim()
      records.push({ id: `block:${percent[1]}`, kind: "block", fields: { name: percent[1], params: inline.slice(0, 120), line: number } })
      if (/(^|\s)end$/i.test(inline) || SINGLE_LINE.has(percent[1].toLowerCase())) {
        block = null
      }
      return
    }

    if (block) {
      if (line.toLowerCase() === "end") {
        block = null
        return
      }
      records.push({ id: `param:${block.name}:${number}`, kind: "parameter", fields: { block: block.name, value: line.slice(0, 120), line: number } })
      return
    }

    const coordsStart = /^\*\s*(xyz|xyzfile|int|gzmt)\s+(-?\d+)\s+(\d+)/i.exec(line)
    if (coordsStart) {
      coords = { charge: coordsStart[2], mult: coordsStart[3], line: number, rows: 0 }
      records.push({ id: `coords:${number}`, kind: "coordinates", fields: { kind: coordsStart[1], charge: Number(coordsStart[2]), multiplicity: Number(coordsStart[3]) } })
      return
    }

    if (line === "*") {
      if (!coords) issues.push({ code: "stray-star", severity: "error", message: "* closes a coordinates block that was never opened", line: number })
      coords = null
      return
    }

    if (coords) {
      const cells = line.split(/\s+/)
      if (cells.length < 4) {
        issues.push({ code: "short-atom", severity: "error", message: `Coordinate row needs label and 3 numbers: ${line.slice(0, 40)}`, line: number })
      }
      coords.rows += 1
      records.push({ id: `atom:${number}`, kind: "atom", fields: { label: cells[0] ?? "", row: coords.rows } })
    }
  })

  const openBlock = currentBlock()
  if (openBlock) {
    issues.push({ code: "unterminated-block", severity: "error", message: `%${openBlock.name} opened at line ${openBlock.line} has no end`, line: openBlock.line })
  }
  const openCoords = currentCoords()
  if (openCoords) {
    issues.push({ code: "unclosed-coordinates", severity: "error", message: "Coordinates block has no closing *", line: openCoords.line })
  }
  if (!sawSimple) {
    issues.push({ code: "no-method", severity: "error", message: "Input has no ! method line" })
  }

  return {
    format: "ORCA",
    records,
    meta: {
      methodKeywords: methods.length,
      blocks: records.filter((record) => record.kind === "block").length,
      atoms: records.filter((record) => record.kind === "atom").length,
      hasCoordinates: records.some((record) => record.kind === "coordinates"),
    },
    issues,
  }
}

const reference = [
  "ORCA input",
  "",
  "! B3LYP def2-SVP Opt",
  "%pal nprocs 4 end",
  "%maxcore 3000",
  "* xyz 0 1",
  "O 0.0 0.0 0.0",
  "H 0.75 0.5 0.0",
  "*",
  "",
  "! starts the simple keyword line.",
  "%name starts a block that ends with end, or inline with end.",
  "* opens a coordinates block: * xyz charge multiplicity.",
  "Coordinate rows are element and x y z.",
].join("\n")

export const format: FormatModule = {
  slug: "orca",
  displayName: "ORCA",
  extensions: [".orca", ".inp"],
  description: "Parse ORCA inputs, validate method lines, blocks and coordinates.",
  reference,
  parse,
  sample: () =>
    [
      "! B3LYP def2-SVP Opt",
      "%pal nprocs 4 end",
      "%maxcore 3000",
      "* xyz 0 1",
      "O 0.0 0.0 0.0",
      "H 0.75 0.5 0.0",
      "*",
    ].join("\n") + "\n",
}
