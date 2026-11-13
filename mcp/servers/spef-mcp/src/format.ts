import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter((line) => line.length > 0)

  let header = false
  let ended = false
  let nets = 0
  let caps = 0
  let ress = 0
  let section = ""
  const units = new Map<string, string>()

  for (const [index, line] of lines.entries()) {
    const lineNo = index + 1
    if (/^\*SPEF\b/.test(line)) {
      header = true
      continue
    }
    if (/^\*END\b/.test(line)) {
      ended = true
      continue
    }
    const unit = /^\*(T|C|R|L)_UNIT\s+(\S+)\s+(\S+)/.exec(line)
    if (unit) {
      units.set(unit[1], `${unit[2]} ${unit[3]}`.trim())
      continue
    }
    if (/^\*D_NET\b/.test(line)) {
      nets += 1
      const parts = line.split(/\s+/)
      if (!parts[1]) issues.push({ code: "net-without-name", severity: "error", message: "D_NET has no net name", line: lineNo })
      records.push({ id: `net:${parts[1] ?? nets}`, kind: "net", fields: { name: parts[1] ?? "", capacitance: parts[2] ?? "", line: lineNo } })
      continue
    }
    if (/^\*(CAP|RES|CONN|POWER|GROUND|INDUCT)\b/.test(line)) {
      section = line.slice(1).split(/\s+/)[0]
      continue
    }
    if (!line.startsWith("*") && section) {
      const parts = line.split(/\s+/)
      const value = Number(parts[parts.length - 1])
      if (section === "CAP") {
        caps += 1
        if (!Number.isFinite(value)) issues.push({ code: "bad-cap", severity: "error", message: `Capacitance is not numeric: ${parts.join(" ")}`, line: lineNo })
      }
      if (section === "RES") {
        ress += 1
        if (!Number.isFinite(value)) issues.push({ code: "bad-res", severity: "error", message: `Resistance is not numeric: ${parts.join(" ")}`, line: lineNo })
      }
    }
  }

  if (!header) issues.push({ code: "no-header", severity: "error", message: "File must start with *SPEF" })
  if (!ended) issues.push({ code: "no-end", severity: "error", message: "File has no *END" })
  if (nets === 0) issues.push({ code: "no-nets", severity: "error", message: "File has no *D_NET" })
  if (!units.has("T")) issues.push({ code: "no-time-unit", severity: "warning", message: "No *T_UNIT declared" })

  return {
    format: "SPEF",
    records,
    meta: { nets, caps, res: ress, units: [...units.entries()].map(([key, value]) => `${key}=${value}`).join(";") },
    issues,
  }
}

const reference = [
  "SPEF parasitic exchange (IEEE 1481)",
  "",
  '*SPEF "IEEE 1481-1998"',
  '*DESIGN "chip"',
  '*DATE "2026-11-13"',
  "*T_UNIT 1 PS",
  "*C_UNIT 1 FF",
  "*R_UNIT 1 OHM",
  "*D_NET net1 0.5",
  "*CAP",
  "1 node1 0.1",
  "*RES",
  "1 node1 node2 10.0",
  "*END",
  "",
  "First line is *SPEF.",
  "Units are declared with *T_UNIT, *C_UNIT and *R_UNIT.",
  "Each net starts with *D_NET and ends at the next net.",
].join("\n")

export const format: FormatModule = {
  slug: "spef",
  displayName: "SPEF",
  extensions: [".spef"],
  description: "Parse SPEF parasitics, validate units, nets, caps and resistances.",
  reference,
  parse,
  sample: () =>
    [
      '*SPEF "IEEE 1481-1998"',
      '*DESIGN "chip"',
      '*DATE "2026-11-13"',
      "*T_UNIT 1 PS",
      "*C_UNIT 1 FF",
      "*R_UNIT 1 OHM",
      "*D_NET net1 0.5",
      "*CAP",
      "1 node1 0.1",
      "*RES",
      "1 node1 node2 10.0",
      "*END",
    ].join("\n") + "\n",
}
