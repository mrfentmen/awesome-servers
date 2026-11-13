import type { FormatModule, Issue, Parsed, ParsedRecord } from "./types.js"

const SEVERITY = ["emerg", "alert", "crit", "err", "warning", "notice", "info", "debug"]
const FACILITY = [
  "kern", "user", "mail", "daemon", "auth", "syslog", "lpr", "news",
  "uucp", "cron", "authpriv", "ftp", "ntp", "audit", "alert", "clock",
  "local0", "local1", "local2", "local3", "local4", "local5", "local6", "local7",
]

function parsePriorities(pri: number): { facility: string; severity: string } {
  const facilityIndex = Math.floor(pri / 8)
  return {
    facility: FACILITY[facilityIndex] ?? `facility${facilityIndex}`,
    severity: SEVERITY[pri % 8] ?? "unknown",
  }
}

function parse(text: string): Parsed {
  const issues: Issue[] = []
  const records: ParsedRecord[] = []
  const bySeverity: Record<string, number> = {}
  const hosts = new Set<string>()
  let rfc5424 = 0
  let rfc3164 = 0
  let unparsed = 0

  text.split(/\r?\n/).forEach((raw, index) => {
    const number = index + 1
    const line = raw.trim()
    if (line.length === 0) return

    const priMatch = /^<(\d{1,3})>/.exec(line)
    if (!priMatch) {
      issues.push({ code: "missing-pri", severity: "error", message: "Line does not start with <PRI>", line: number })
      unparsed += 1
      return
    }

    const pri = Number(priMatch[1])
    if (pri < 0 || pri > 191) {
      issues.push({ code: "bad-pri", severity: "error", message: `PRI must be 0-191, got ${pri}`, line: number })
    }
    const { facility, severity } = parsePriorities(pri)
    bySeverity[severity] = (bySeverity[severity] ?? 0) + 1

    const rest = line.slice(priMatch[0].length)
    let version: number | null = null
    let timestamp = ""
    let host = ""
    let app = ""
    let procId = ""
    let msgId = ""
    let message = ""

    if (/^1 /.test(rest)) {
      version = 1
      rfc5424 += 1
      const parts = rest.slice(2).split(" ")
      timestamp = parts[0] ?? ""
      host = parts[1] ?? ""
      app = parts[2] ?? ""
      procId = parts[3] ?? ""
      msgId = parts[4] ?? ""
      const sdStart = rest.indexOf("[")
      if (sdStart === -1 && !rest.includes(" - ")) {
        issues.push({ code: "missing-sd", severity: "warning", message: "RFC5424 line has no structured data or nil value", line: number })
      }
      const msgIndex = rest.indexOf("] ")
      message = msgIndex >= 0 ? rest.slice(msgIndex + 2) : rest.split(" ").slice(6).join(" ")
      if (timestamp !== "-" && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/.test(timestamp)) {
        issues.push({ code: "bad-timestamp", severity: "error", message: `Timestamp is not RFC3339: ${timestamp}`, line: number })
      }
    } else {
      rfc3164 += 1
      const match = /^([A-Z][a-z]{2}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})\s+(\S+)\s+([^:\[]+)(?:\[(\d+)\])?:\s?(.*)$/.exec(rest)
      if (match) {
        timestamp = match[1]
        host = match[2]
        app = match[3].trim()
        procId = match[4] ?? ""
        message = match[5]
      } else {
        host = rest.split(/\s+/)[0] ?? ""
        message = rest
        issues.push({ code: "loose-3164", severity: "warning", message: "RFC3164 header did not match the usual shape", line: number })
      }
      if (!/^[A-Z][a-z]{2}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}$/.test(timestamp)) {
        issues.push({ code: "bad-timestamp", severity: "warning", message: `RFC3164 timestamp looks wrong: ${timestamp}`, line: number })
      }
    }

    if (host && host !== "-") hosts.add(host)

    records.push({
      id: `line-${number}`,
      kind: version === 1 ? "rfc5424" : "rfc3164",
      fields: {
        pri,
        facility,
        severity,
        version,
        timestamp,
        host,
        app,
        procId,
        msgId,
        message,
        line: number,
      },
    })
  })

  return {
    format: "syslog",
    records,
    meta: {
      messages: records.length,
      rfc5424,
      rfc3164,
      unparsed,
      hosts: hosts.size,
      ...Object.fromEntries(Object.entries(bySeverity).map(([key, value]) => [`severity_${key}`, value])),
    },
    issues,
  }
}

const reference = [
  "syslog lines",
  "",
  "RFC5424: <PRI>1 TIMESTAMP HOST APP PROCID MSGID STRUCTURED-DATA MSG",
  "RFC3164: <PRI>MMM dd hh:mm:ss HOST TAG: MSG",
  "PRI = facility * 8 + severity. Severity 0 emerg to 7 debug.",
  "Facilities include kern, user, mail, daemon, auth, cron, local0-local7.",
  "A nil timestamp, host or structured data is written as -.",
].join("\n")

export const format: FormatModule = {
  slug: "syslog-rfc5424",
  displayName: "syslog",
  extensions: [".log", ".syslog"],
  description: "Parse RFC5424 and RFC3164 syslog lines, decode PRI and summarize sources.",
  reference,
  parse,
  sample: () =>
    [
      '<34>1 2026-01-01T12:00:00Z host1 app 123 ID47 - message one',
      "<13>Jan  1 12:00:00 host2 cron[45]: message two",
    ].join("\n") + "\n",
}
