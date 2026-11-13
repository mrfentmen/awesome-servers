import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

const NAMELISTS = new Set(["control", "system", "electrons", "ions", "cell"])
const CARDS = new Set(["ATOMIC_SPECIES", "ATOMIC_POSITIONS", "K_POINTS", "CELL_PARAMETERS", "ATOMIC_FORCES", "CONSTRAINTS", "OCCUPATIONS", "HUBBARD"])

function unquote(value: string): string {
  const trimmed = value.trim()
  if ((trimmed.startsWith("'") && trimmed.endsWith("'")) || (trimmed.startsWith('"') && trimmed.endsWith('"'))) {
    return trimmed.slice(1, -1)
  }
  return trimmed.replace(/,$/, "")
}

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const names = new Set<string>()
  const values = new Map<string, string>()
  let current: string | null = null
  let currentLine = 0
  let card: string | null = null
  let cardRows = 0
  let sawControl = false

  text.split(/\r?\n/).forEach((raw, index) => {
    const number = index + 1
    const line = raw.replace(/[!#].*$/, "").trim()
    if (line.length === 0) return

    const open = /^&([A-Za-z_]\w*)$/.exec(line)
    if (open) {
      if (current) {
        issues.push({ code: "unterminated-namelist", severity: "error", message: `&${current} opened at line ${currentLine} has no /`, line: currentLine })
      }
      current = open[1].toLowerCase()
      currentLine = number
      if (!NAMELISTS.has(current)) {
        issues.push({ code: "unknown-namelist", severity: "warning", message: `Unknown namelist &${open[1]}`, line: number })
      }
      if (current === "control") sawControl = true
      card = null
      records.push({ id: `namelist:${current}`, kind: "namelist", fields: { name: current, line: number } })
      return
    }

    if (line === "/") {
      if (!current) issues.push({ code: "stray-slash", severity: "error", message: "/ without an open namelist", line: number })
      current = null
      return
    }

    if (current) {
      const pair = /^([A-Za-z_]\w*)\s*=\s*(.+)$/.exec(line)
      if (!pair) {
        issues.push({ code: "bad-assignment", severity: "error", message: `Namelist line is not key = value: ${line.slice(0, 40)}`, line: number })
        return
      }
      const key = pair[1].toLowerCase()
      const value = unquote(pair[2])
      values.set(key, value)
      records.push({ id: `param:${key}`, kind: "parameter", fields: { name: key, value: value.slice(0, 120), namelist: current } })
      return
    }

    const cardMatch = /^([A-Z_]+)(?:\s+(\S+))?$/.exec(line)
    if (cardMatch && CARDS.has(cardMatch[1])) {
      card = cardMatch[1]
      cardRows = 0
      records.push({ id: `card:${card}`, kind: "card", fields: { name: card, option: cardMatch[2] ?? "" } })
      return
    }

    if (card) {
      cardRows += 1
      const cells = line.split(/\s+/)
      if (card === "ATOMIC_POSITIONS" && cells.length < 4) {
        issues.push({ code: "short-position", severity: "error", message: `ATOMIC_POSITIONS row needs label and 3 coordinates: ${line.slice(0, 40)}`, line: number })
      }
      records.push({ id: `row:${card}:${cardRows}`, kind: "row", fields: { card, cells: cells.length, first: cells[0] ?? "" } })
      return
    }

    if (!CARDS.has(line.split(/\s+/)[0])) {
      issues.push({ code: "unknown-line", severity: "warning", message: `Not a namelist, card or card row: ${line.slice(0, 40)}`, line: number })
    }
  })

  if (current) {
    issues.push({ code: "unterminated-namelist", severity: "error", message: `&${current} opened at line ${currentLine} has no /`, line: currentLine })
  }
  if (!sawControl) {
    issues.push({ code: "missing-control", severity: "error", message: "Input has no &control namelist" })
  }
  if (!values.has("calculation")) {
    issues.push({ code: "missing-calculation", severity: "warning", message: "&control has no calculation keyword" })
  }

  return {
    format: "Quantum ESPRESSO",
    records,
    meta: {
      namelists: records.filter((record) => record.kind === "namelist").length,
      parameters: records.filter((record) => record.kind === "parameter").length,
      calculation: values.get("calculation") ?? "",
      prefix: values.get("prefix") ?? "",
      cardRows: records.filter((record) => record.kind === "row").length,
    },
    issues,
  }
}

const reference = [
  "Quantum ESPRESSO pw.x input",
  "",
  "&control",
  "  calculation = 'scf'",
  "  prefix = 'demo'",
  "/",
  "&system",
  "  ecutwfc = 30.0",
  "/",
  "ATOMIC_SPECIES",
  "Si 28.086 Si.pbe.UPF",
  "ATOMIC_POSITIONS crystal",
  "Si 0.0 0.0 0.0",
  "K_POINTS automatic",
  "1 1 1 0 0 0",
  "",
  "Namelists open with &name and close with /.",
  "Keywords are key = value.",
  "Cards are upper case names followed by rows.",
].join("\n")

export const format: FormatModule = {
  slug: "quantum-espresso",
  displayName: "Quantum ESPRESSO",
  extensions: [".in", ".pwi"],
  description: "Parse Quantum ESPRESSO inputs, validate namelists and cards.",
  reference,
  parse,
  sample: () =>
    [
      "&control",
      "  calculation = 'scf'",
      "  prefix = 'demo'",
      "/",
      "&system",
      "  ecutwfc = 30.0",
      "/",
      "ATOMIC_SPECIES",
      "Si 28.086 Si.pbe.UPF",
      "ATOMIC_POSITIONS crystal",
      "Si 0.0 0.0 0.0",
      "K_POINTS automatic",
      "1 1 1 0 0 0",
    ].join("\n") + "\n",
}
