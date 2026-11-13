import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

const ENUMS: Record<string, Set<string>> = {
  auto: new Set(["start", "route", "add", "ignore"]),
  keyexchange: new Set(["ike", "ikev1", "ikev2"]),
  authby: new Set(["secret", "rsasig", "ecdsa", "rsa", "never", "psk"]),
  dpdaction: new Set(["clear", "hold", "restart"]),
  type: new Set(["tunnel", "transport", "passthrough", "drop"]),
  compress: new Set(["yes", "no"]),
}

interface Section {
  type: string
  name: string
  line: number
  keys: Map<string, string>
}

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const sections: Section[] = []
  let current: Section | null = null
  let includes = 0

  if (text.trim().length === 0) issues.push({ code: "empty", severity: "error", message: "Document is empty" })

  text.split(/\r?\n/).forEach((raw, index) => {
    const lineNo = index + 1
    const line = raw.trim()
    if (!line || line.startsWith("#")) return
    const header = /^(config|conn|ca)\s+([A-Za-z0-9_.%:-]+)$/.exec(line)
    if (header) {
      current = { type: header[1], name: header[2], line: lineNo, keys: new Map() }
      sections.push(current)
      return
    }
    const include = /^include\s+(\S+)$/.exec(line)
    if (include) {
      includes += 1
      records.push({ id: `include:${includes}`, kind: "include", fields: { path: include[1], line: lineNo } })
      return
    }
    const setting = /^([A-Za-z_][\w.-]*)\s*=\s*(.*)$/.exec(line)
    if (setting) {
      if (!current) {
        issues.push({ code: "no-section", severity: "error", message: "Setting outside a config, conn or ca section", line: lineNo })
        return
      }
      const key = setting[1]
      const value = setting[2].trim().replace(/^"(.*)"$/, "$1")
      if (!value) issues.push({ code: "empty-value", severity: "error", message: `${key} has no value`, line: lineNo })
      if (current.keys.has(key)) issues.push({ code: "duplicate-key", severity: "warning", message: `${key} appears twice in ${current.type} ${current.name}`, line: lineNo })
      current.keys.set(key, value)
      const allowed = ENUMS[key]
      if (allowed && value && !allowed.has(value)) {
        issues.push({ code: "bad-value", severity: "error", message: `${key}=${value} is not one of ${[...allowed].join(", ")}`, line: lineNo })
      }
      if (["left", "right", "leftsubnet", "rightsubnet"].includes(key) && !/^(\d{1,3}\.){3}\d{1,3}|[0-9A-Fa-f:]+|%/.test(value)) {
        issues.push({ code: "bad-address", severity: "error", message: `${key} does not look like an address or subnet: ${value}`, line: lineNo })
      }
      records.push({ id: `setting:${current.type}:${current.name}:${key}`, kind: "setting", fields: { section: `${current.type} ${current.name}`, key, value, line: lineNo } })
      return
    }
    issues.push({ code: "bad-line", severity: "error", message: `Cannot parse line: ${line}`, line: lineNo })
  })

  const seen = new Set<string>()
  for (const section of sections) {
    const key = `${section.type}:${section.name}`
    if (seen.has(key)) issues.push({ code: "duplicate-section", severity: "error", message: `Duplicate ${section.type} ${section.name}`, line: section.line })
    seen.add(key)
    if (section.type === "conn" && section.name !== "%default") {
      if (!section.keys.has("left")) issues.push({ code: "no-left", severity: "error", message: `conn ${section.name} has no left address`, line: section.line })
      if (!section.keys.has("right")) issues.push({ code: "no-right", severity: "error", message: `conn ${section.name} has no right address`, line: section.line })
    }
    records.push({
      id: `section:${section.type}:${section.name}`,
      kind: "section",
      fields: {
        sectionType: section.type,
        name: section.name,
        keys: section.keys.size,
        left: section.keys.get("left") ?? "",
        right: section.keys.get("right") ?? "",
        auto: section.keys.get("auto") ?? "",
        line: section.line,
      },
    })
  }

  const conns = sections.filter((section) => section.type === "conn").length
  if (conns === 0) issues.push({ code: "no-conns", severity: "error", message: "No conn sections found" })
  if (!sections.some((section) => section.type === "config" && section.name === "setup")) {
    issues.push({ code: "no-config", severity: "warning", message: "Missing config setup section" })
  }

  return {
    format: "ipsec.conf",
    records,
    meta: { sections: sections.length, conns, settings: sections.reduce((sum, section) => sum + section.keys.size, 0), includes },
    issues,
  }
}

const reference = [
  "strongSwan ipsec.conf",
  "",
  "config setup",
  '    charondebug="ike 2, knl 2"',
  "",
  "conn %default",
  "    keyexchange=ikev2",
  "    dpdaction=clear",
  "",
  "conn demo",
  "    left=192.0.2.1",
  "    leftsubnet=10.0.0.0/24",
  "    right=192.0.2.2",
  "    rightsubnet=10.1.0.0/24",
  "    auto=start",
  "    authby=secret",
  "",
  "Sections start with config, conn or ca and a name.",
  "Every conn except %default needs left and right addresses.",
  "enum values are checked for auto, keyexchange, authby, dpdaction, type and compress.",
].join("\n")

export const format: FormatModule = {
  slug: "ipsec-conf",
  displayName: "ipsec.conf",
  extensions: ["ipsec.conf", ".ipsec"],
  description: "Parse strongSwan configs, validate sections, addresses and enum values.",
  reference,
  parse,
  sample: () =>
    [
      "config setup",
      '    charondebug="ike 2, knl 2"',
      "",
      "conn %default",
      "    keyexchange=ikev2",
      "    dpdaction=clear",
      "",
      "conn demo",
      "    left=192.0.2.1",
      "    leftsubnet=10.0.0.0/24",
      "    right=192.0.2.2",
      "    rightsubnet=10.1.0.0/24",
      "    auto=start",
      "    authby=secret",
    ].join("\n") + "\n",
}
