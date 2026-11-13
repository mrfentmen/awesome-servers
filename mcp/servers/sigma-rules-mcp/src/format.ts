import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

const LEVELS = new Set(["informational", "low", "medium", "high", "critical"])
const STATUSES = new Set(["stable", "test", "experimental", "deprecated", "unsupported"])

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const ids = new Set<string>()
  const docs = text.split(/^---\s*$/m).map((doc) => doc.trim()).filter((doc) => doc.length > 0)
  let rules = 0
  let withDetection = 0

  for (const [index, doc] of docs.entries()) {
    const lines = doc.split(/\r?\n/)
    const get = (key: string): string => {
      const match = new RegExp(`^${key}:\\s*(.+)$`).exec(lines.find((line) => line.startsWith(`${key}:`)) ?? "")
      return match ? match[1].replace(/^["']|["']$/g, "").trim() : ""
    }
    const title = get("title")
    const id = get("id")
    const level = get("level")
    const status = get("status")
    const hasDetection = lines.some((line) => /^detection:\s*$/.test(line))
    const lineNo = index + 1

    if (!title) issues.push({ code: "no-title", severity: "error", message: `Rule ${lineNo} has no title`, line: lineNo })
    if (!id) {
      issues.push({ code: "no-id", severity: "error", message: `Rule ${lineNo} has no id`, line: lineNo })
    } else if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      issues.push({ code: "bad-id", severity: "error", message: `Rule id is not a UUID: ${id}`, line: lineNo })
    } else if (ids.has(id)) {
      issues.push({ code: "duplicate-id", severity: "error", message: `Rule id ${id} appears twice`, line: lineNo })
    }
    ids.add(id)
    if (!hasDetection) issues.push({ code: "no-detection", severity: "error", message: `Rule ${lineNo} has no detection block`, line: lineNo })
    else withDetection += 1
    if (level && !LEVELS.has(level)) {
      issues.push({ code: "bad-level", severity: "error", message: `Unknown level: ${level}`, line: lineNo })
    }
    if (status && !STATUSES.has(status)) {
      issues.push({ code: "bad-status", severity: "error", message: `Unknown status: ${status}`, line: lineNo })
    }

    rules += 1
    records.push({ id: `rule:${id || rules}`, kind: "rule", fields: { title, id, level, status, line: lineNo } })
  }

  if (rules === 0) issues.push({ code: "empty", severity: "error", message: "File has no Sigma rule" })

  return {
    format: "Sigma",
    records,
    meta: { rules, withDetection },
    issues,
  }
}

const reference = [
  "Sigma detection rule (YAML)",
  "",
  "title: Suspicious PowerShell",
  "id: 11111111-2222-3333-4444-555555555555",
  "status: stable",
  "level: high",
  "logsource:",
  "  product: windows",
  "detection:",
  "  selection:",
  "    EventID: 4688",
  "  condition: selection",
  "",
  "Rules are separated by ---.",
  "Every rule needs a title, a UUID id and a detection block.",
  "level is informational, low, medium, high or critical.",
].join("\n")

export const format: FormatModule = {
  slug: "sigma-rules",
  displayName: "Sigma rules",
  extensions: [".yml", ".yaml"],
  description: "Parse Sigma rules, validate ids, levels, statuses and detection blocks.",
  reference,
  parse,
  sample: () =>
    [
      "title: Suspicious PowerShell",
      "id: 11111111-2222-3333-4444-555555555555",
      "status: stable",
      "level: high",
      "logsource:",
      "  product: windows",
      "detection:",
      "  selection:",
      "    EventID: 4688",
      "  condition: selection",
    ].join("\n") + "\n",
}
