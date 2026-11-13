import type { FormatModule, Parsed, ParsedRecord } from "./types.js"
import { readRoot, validateXml } from "./_xml.js"

const textOf = (block: string, tag: string): string => {
  const match = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, "i").exec(block)
  return match ? match[1].replace(/<[^>]+>/g, "").trim() : ""
}
const attrs = (source: string): Record<string, string> =>
  Object.fromEntries([...source.matchAll(/([\w:-]+)="([^"]*)"/g)].map((match) => [match[1], match[2]]))

function parse(source: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const root = readRoot(source)
  validateXml(source, root, "OpenVAS report", issues)
  if (root && root !== "report") issues.push({ code: "bad-root", severity: "error", message: `Root must be report, found ${root}` })

  const results = [...source.matchAll(/<result\b([^>]*)>([\s\S]*?)<\/result>/gi)]
  const ids = new Set<string>()
  let maxSeverity = 0
  for (const result of results) {
    const meta = attrs(result[1])
    const id = meta.id ?? `result:${records.length + 1}`
    const name = textOf(result[2], "name")
    const host = textOf(result[2], "host")
    const port = textOf(result[2], "port")
    const severityText = textOf(result[2], "severity")
    const severity = Number(severityText)
    const nvt = /<nvt\b([^>]*?)\/?>/i.exec(result[2])?.[1] ?? ""
    const oid = attrs(nvt).oid ?? ""
    if (ids.has(id)) issues.push({ code: "duplicate-id", severity: "error", message: `Duplicate result id ${id}` })
    ids.add(id)
    if (!name) issues.push({ code: "no-name", severity: "error", message: `Result ${id} has no name` })
    if (!host) issues.push({ code: "no-host", severity: "error", message: `Result ${id} has no host` })
    if (!severityText || !Number.isFinite(severity) || severity < 0 || severity > 10) {
      issues.push({ code: "bad-severity", severity: "error", message: `Result ${id} severity must be 0-10: ${severityText || "missing"}` })
    } else {
      maxSeverity = Math.max(maxSeverity, severity)
    }
    if (port && !/^\d+\/(tcp|udp)$/i.test(port)) issues.push({ code: "bad-port", severity: "error", message: `Invalid port ${port}` })
    if (oid && !/^[\d.]+$/.test(oid)) issues.push({ code: "bad-oid", severity: "error", message: `Invalid NVT oid ${oid}` })
    records.push({ id: `result:${id}`, kind: "result", fields: { resultId: id, name, host, port, severity: Number.isFinite(severity) ? severity : -1, oid } })
  }

  const status = textOf(source, "scan_run_status")
  if (!status) issues.push({ code: "no-status", severity: "warning", message: "Report has no scan_run_status" })
  else if (!["Done", "Running", "Stopped", "New", "Requested", "Paused"].includes(status)) issues.push({ code: "unknown-status", severity: "warning", message: `Unknown scan status ${status}` })
  if (results.length === 0) issues.push({ code: "no-results", severity: "error", message: "Report has no results" })

  return { format: "OpenVAS", records, meta: { status, results: results.length, maxSeverity }, issues }
}

const reference = [
  "OpenVAS report XML",
  "",
  '<report id="demo">',
  "  <scan_run_status>Done</scan_run_status>",
  "  <results>",
  '    <result id="r1">',
  "      <name>Weak SSH config</name>",
  "      <host>192.0.2.10</host>",
  "      <port>22/tcp</port>",
  "      <severity>5.0</severity>",
  '      <nvt oid="1.3.6.1.4.1.25623.1.0.100001"/>',
  "    </result>",
  "  </results>",
  "</report>",
  "",
  "Each result needs a name, host and severity from 0 to 10.",
  "Ports use the form 22/tcp or 53/udp.",
  "NVT oids are dotted numbers.",
].join("\n")

export const format: FormatModule = {
  slug: "openvas",
  displayName: "OpenVAS",
  extensions: [".xml", ".openvas"],
  description: "Parse OpenVAS reports, validate findings, hosts, ports and severities.",
  reference,
  parse,
  sample: () =>
    [
      '<?xml version="1.0"?>',
      '<report id="demo">',
      "  <scan_run_status>Done</scan_run_status>",
      "  <results>",
      '    <result id="r1">',
      "      <name>Weak SSH config</name>",
      "      <host>192.0.2.10</host>",
      "      <port>22/tcp</port>",
      "      <severity>5.0</severity>",
      '      <nvt oid="1.3.6.1.4.1.25623.1.0.100001"/>',
      "      <description>Demo finding</description>",
      "    </result>",
      "  </results>",
      "</report>",
    ].join("\n") + "\n",
}
