import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const tools = new Set<string>()
  let header = false
  let ended = false
  let units = ""
  let selected = ""
  let drills = 0

  for (const [index, raw] of text.split(/\r?\n/).entries()) {
    const line = raw.trim()
    const lineNo = index + 1
    if (!line) continue
    if (line === "M48") {
      header = true
      continue
    }
    if (line === "M30") {
      ended = true
      continue
    }
    if (line === "%" || line === "G90" || line === "G05") continue
    if (/^(METRIC|INCH)/.test(line)) {
      units = line.split(",")[0]
      continue
    }
    const tool = /^T(\d+)C([\d.]+)/.exec(line)
    if (tool) {
      if (tools.has(tool[1])) issues.push({ code: "duplicate-tool", severity: "error", message: `Duplicate tool T${tool[1]}`, line: lineNo })
      tools.add(tool[1])
      records.push({ id: `tool:T${tool[1]}`, kind: "tool", fields: { diameter: Number(tool[2]), line: lineNo } })
      continue
    }
    const select = /^T(\d+)$/.exec(line)
    if (select) {
      selected = select[1]
      if (!tools.has(selected)) issues.push({ code: "unknown-tool", severity: "error", message: `Selected tool T${selected} is not defined`, line: lineNo })
      continue
    }
    const coord = /^X(-?\d+(?:\.\d+)?)Y(-?\d+(?:\.\d+)?)/.exec(line)
    if (coord) {
      if (!selected) issues.push({ code: "no-tool", severity: "error", message: "Drill coordinate before any tool selection", line: lineNo })
      drills += 1
      records.push({ id: `drill:${drills}`, kind: "drill", fields: { x: Number(coord[1]), y: Number(coord[2]), tool: selected, line: lineNo } })
    }
  }

  if (!header) issues.push({ code: "no-header", severity: "error", message: "Missing M48 header" })
  if (!ended) issues.push({ code: "no-end", severity: "error", message: "Missing M30 end marker" })
  if (!units) issues.push({ code: "no-units", severity: "warning", message: "No METRIC or INCH units" })
  if (tools.size === 0) issues.push({ code: "no-tools", severity: "error", message: "No tool definitions" })
  if (drills === 0) issues.push({ code: "no-drills", severity: "error", message: "No drill coordinates" })

  return { format: "Excellon", records, meta: { tools: tools.size, drills, units: units || "unknown" }, issues }
}

const reference = [
  "Excellon drill file",
  "",
  "M48",
  "METRIC,TZ",
  "T1C0.035",
  "%",
  "G90",
  "T1",
  "X1000Y2000",
  "X2000Y3000",
  "M30",
  "",
  "Header starts with M48.",
  "Tools are defined as T<n>C<diameter>.",
  "Coordinates are X<number>Y<number> and need a selected tool.",
  "M30 ends the file.",
].join("\n")

export const format: FormatModule = {
  slug: "excellon",
  displayName: "Excellon",
  extensions: [".drl", ".xln"],
  description: "Parse Excellon drill files, validate tools, units and coordinates.",
  reference,
  parse,
  sample: () =>
    ["M48", "METRIC,TZ", "T1C0.035", "%", "G90", "T1", "X1000Y2000", "X2000Y3000", "M30"].join("\n") + "\n",
}
