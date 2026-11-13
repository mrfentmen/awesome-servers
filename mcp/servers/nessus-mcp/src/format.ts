import type { FormatModule, Parsed, ParsedRecord } from "./types.js"
import { readRoot, scanTags, validateXml } from "./_xml.js"

const textOf = (block: string, tag: string): string => {
  const match = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, "i").exec(block)
  return match ? match[1].replace(/<[^>]+>/g, "").trim() : ""
}

function parse(source: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const root = readRoot(source)
  validateXml(source, root, "Nessus scan", issues)
  if (root && root !== "NessusClientData_v2") {
    issues.push({ code: "bad-root", severity: "error", message: `Root must be NessusClientData_v2, found ${root}` })
  }

  let host = ""
  let hostLine = 0
  let hostCount = 0
  let findings = 0
  let maxSeverity = 0
  for (const tag of scanTags(source)) {
    if (tag.close && tag.name === "ReportHost") {
      host = ""
      hostLine = 0
      continue
    }
    if (!tag.close && tag.name === "ReportHost") {
      host = tag.attrs.name ?? ""
      hostLine = tag.line
      hostCount += 1
      if (!host) issues.push({ code: "no-host-name", severity: "error", message: "ReportHost has no name", line: tag.line })
      records.push({ id: `host:${hostCount}`, kind: "host", fields: { name: host, line: tag.line } })
      continue
    }
    if (!tag.close && tag.name === "ReportItem") {
      if (!host) issues.push({ code: "orphan-item", severity: "error", message: "ReportItem outside a ReportHost", line: tag.line })
      const severity = Number(tag.attrs.severity)
      if (tag.attrs.severity === undefined || !Number.isInteger(severity) || severity < 0 || severity > 4) {
        issues.push({ code: "bad-severity", severity: "error", message: `severity must be 0-4, found ${tag.attrs.severity ?? "nothing"}`, line: tag.line })
      } else {
        maxSeverity = Math.max(maxSeverity, severity)
      }
      const pluginId = tag.attrs.pluginID ?? ""
      if (!/^\d+$/.test(pluginId)) issues.push({ code: "bad-plugin", severity: "error", message: `pluginID must be numeric: ${pluginId || "missing"}`, line: tag.line })
      const port = tag.attrs.port ?? ""
      if (port && (!/^\d+$/.test(port) || Number(port) > 65535)) issues.push({ code: "bad-port", severity: "error", message: `Invalid port ${port}`, line: tag.line })
      const protocol = tag.attrs.protocol ?? ""
      if (protocol && !["tcp", "udp", "icmp", "ip"].includes(protocol)) issues.push({ code: "bad-protocol", severity: "error", message: `Invalid protocol ${protocol}`, line: tag.line })
      const pluginName = tag.attrs.pluginName ?? ""
      if (!pluginName) issues.push({ code: "no-plugin-name", severity: "warning", message: "ReportItem has no pluginName", line: tag.line })
      findings += 1
      records.push({
        id: `finding:${findings}`,
        kind: "finding",
        fields: {
          host,
          pluginID: pluginId,
          pluginName,
          severity: Number.isInteger(severity) ? severity : -1,
          port,
          protocol,
          line: tag.line,
          hostLine,
        },
      })
    }
  }

  if (hostCount === 0) issues.push({ code: "no-hosts", severity: "error", message: "Scan has no ReportHost" })
  if (findings === 0) issues.push({ code: "no-findings", severity: "warning", message: "Scan has no ReportItem" })

  return {
    format: "Nessus",
    records,
    meta: { policy: textOf(source, "policyName"), hosts: hostCount, findings, maxSeverity },
    issues,
  }
}

const reference = [
  "Nessus scan XML",
  "",
  "<NessusClientData_v2>",
  "  <Report name=\"demo\">",
  "    <ReportHost name=\"192.0.2.10\">",
  "      <ReportItem port=\"22\" protocol=\"tcp\" severity=\"2\" pluginID=\"12345\" pluginName=\"SSH weak config\"/>",
  "    </ReportHost>",
  "  </Report>",
  "</NessusClientData_v2>",
  "",
  "ReportItem severity runs from 0 to 4.",
  "pluginID must be numeric.",
  "Every ReportItem belongs inside a ReportHost with a name.",
].join("\n")

export const format: FormatModule = {
  slug: "nessus",
  displayName: "Nessus",
  extensions: [".nessus", ".nessus2"],
  description: "Parse Nessus scans, validate hosts, findings, severities and plugin ids.",
  reference,
  parse,
  sample: () =>
    [
      '<?xml version="1.0"?>',
      "<NessusClientData_v2>",
      "  <Policy><policyName>Demo</policyName></Policy>",
      '  <Report name="demo">',
      '    <ReportHost name="192.0.2.10">',
      '      <ReportItem port="22" svc_name="ssh" protocol="tcp" severity="2" pluginID="12345" pluginName="SSH weak config">',
      "        <description>Demo finding</description>",
      "        <risk_factor>Medium</risk_factor>",
      "      </ReportItem>",
      "    </ReportHost>",
      "  </Report>",
      "</NessusClientData_v2>",
    ].join("\n") + "\n",
}
