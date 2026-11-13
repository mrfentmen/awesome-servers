import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

const COMMANDS = new Set([
  "create_power_domain",
  "create_supply_port",
  "create_supply_net",
  "connect_supply_net",
  "add_power_state",
  "set_domain_supply_net",
  "set_port_attributes",
  "create_power_switch",
  "set_isolation",
  "set_retention",
  "set_level_shifter",
])

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const domains = new Set<string>()
  let commands = 0
  let ports = 0
  let nets = 0

  for (const [index, raw] of text.split(/\r?\n/).entries()) {
    const line = raw.replace(/#.*$/, "").trim()
    if (!line) continue
    const lineNo = index + 1
    const command = line.split(/\s+/)[0]
    if (!COMMANDS.has(command)) {
      issues.push({ code: "unknown-command", severity: "error", message: `Unknown UPF command: ${command}`, line: lineNo })
      continue
    }
    commands += 1
    if (command === "create_power_domain") {
      const name = line.split(/\s+/)[1] ?? ""
      if (!name) issues.push({ code: "domain-without-name", severity: "error", message: "create_power_domain has no name", line: lineNo })
      else if (domains.has(name)) issues.push({ code: "duplicate-domain", severity: "error", message: `Power domain ${name} appears twice`, line: lineNo })
      domains.add(name)
    }
    if (command === "create_supply_port") ports += 1
    if (command === "create_supply_net") nets += 1
    records.push({ id: `command:${lineNo}`, kind: command, fields: { command, line: lineNo } })
  }

  const opens = (text.match(/\{/g) ?? []).length
  const closes = (text.match(/\}/g) ?? []).length
  if (opens !== closes) issues.push({ code: "unbalanced", severity: "error", message: `${opens} '{' but ${closes} '}'` })
  if (commands === 0) issues.push({ code: "empty", severity: "error", message: "File has no UPF command" })
  if (domains.size === 0) issues.push({ code: "no-domain", severity: "error", message: "File has no create_power_domain" })

  return {
    format: "UPF",
    records,
    meta: { commands, domains: domains.size, ports, nets },
    issues,
  }
}

const reference = [
  "Unified Power Format (UPF)",
  "",
  "create_power_domain PD_TOP",
  "create_supply_port VDD",
  "create_supply_net VDD",
  "connect_supply_net VDD -ports VDD",
  "set_domain_supply_net PD_TOP -primary_power_net VDD",
  "",
  "Each line is one UPF command.",
  "At least one create_power_domain is required.",
  "Braces must balance.",
].join("\n")

export const format: FormatModule = {
  slug: "upf",
  displayName: "UPF",
  extensions: [".upf"],
  description: "Parse UPF power intent, validate commands, domains and braces.",
  reference,
  parse,
  sample: () =>
    [
      "create_power_domain PD_TOP",
      "create_supply_port VDD",
      "create_supply_net VDD",
      "connect_supply_net VDD -ports VDD",
      "set_domain_supply_net PD_TOP -primary_power_net VDD",
    ].join("\n") + "\n",
}
