import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

const COMMANDS = new Set([
  "create_clock",
  "create_generated_clock",
  "set_input_delay",
  "set_output_delay",
  "set_false_path",
  "set_multicycle_path",
  "set_max_delay",
  "set_min_delay",
  "set_clock_groups",
  "set_driving_cell",
  "set_load",
  "set_clock_uncertainty",
])

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const counts = new Map<string, number>()
  let clocks = 0
  const clean = text.replace(/\\./g, "")
  const openBrackets = (clean.match(/\[/g) ?? []).length
  const closeBrackets = (clean.match(/\]/g) ?? []).length

  for (const [index, raw] of text.split(/\r?\n/).entries()) {
    const line = raw.replace(/#.*$/, "").trim()
    if (!line) continue
    const lineNo = index + 1
    const command = line.split(/\s+/)[0]
    if (!COMMANDS.has(command)) {
      issues.push({ code: "unknown-command", severity: "error", message: `Unknown SDC command: ${command}`, line: lineNo })
      continue
    }
    counts.set(command, (counts.get(command) ?? 0) + 1)
    if (command === "create_clock") {
      clocks += 1
      const period = /-period\s+([\d.]+)/.exec(line)
      if (!period) issues.push({ code: "no-period", severity: "error", message: "create_clock has no -period", line: lineNo })
      else if (!(Number(period[1]) > 0)) issues.push({ code: "bad-period", severity: "error", message: `Period must be positive: ${period[1]}`, line: lineNo })
      if (!/-name\s+\S+/.test(line)) issues.push({ code: "no-clock-name", severity: "warning", message: "create_clock has no -name", line: lineNo })
    }
    records.push({ id: `command:${lineNo}`, kind: command, fields: { command, line: lineNo } })
  }

  if (openBrackets !== closeBrackets) {
    issues.push({ code: "unbalanced", severity: "error", message: `${openBrackets} '[' but ${closeBrackets} ']'` })
  }
  if (records.length === 0) issues.push({ code: "empty", severity: "error", message: "File has no SDC command" })
  if (clocks === 0) issues.push({ code: "no-clock", severity: "warning", message: "File has no create_clock" })

  return {
    format: "SDC",
    records,
    meta: { commands: records.length, clocks, kinds: counts.size },
    issues,
  }
}

const reference = [
  "Synopsys Design Constraints (SDC)",
  "",
  "create_clock -name clk -period 10 [get_ports clk]",
  "set_input_delay -clock clk 2 [get_ports data]",
  "set_false_path -from [get_clocks clk] -to [get_clocks clk2]",
  "",
  "Each line is one SDC command.",
  "create_clock needs -period and a positive number.",
  "Square brackets must balance.",
].join("\n")

export const format: FormatModule = {
  slug: "sdc",
  displayName: "SDC",
  extensions: [".sdc"],
  description: "Parse SDC constraints, validate commands, clocks and brackets.",
  reference,
  parse,
  sample: () =>
    [
      "create_clock -name clk -period 10 [get_ports clk]",
      "set_input_delay -clock clk 2 [get_ports data]",
      "set_false_path -from [get_clocks clk] -to [get_clocks clk2]",
    ].join("\n") + "\n",
}
