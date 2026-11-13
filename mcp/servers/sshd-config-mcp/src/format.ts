import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

const KNOWN = new Set([
  "Port", "AddressFamily", "ListenAddress", "HostKey", "ServerKeyBits", "SyslogFacility", "LogLevel", "LoginGraceTime",
  "PermitRootLogin", "StrictModes", "MaxAuthTries", "MaxSessions", "PubkeyAuthentication", "AuthorizedKeysFile",
  "AuthorizedPrincipalsFile", "HostbasedAuthentication", "IgnoreRhosts", "PermitEmptyPasswords", "PasswordAuthentication",
  "KerberosAuthentication", "UsePAM", "AllowAgentForwarding", "AllowTcpForwarding", "GatewayPorts", "X11Forwarding",
  "X11DisplayOffset", "X11UseLocalhost", "PrintMotd", "PrintLastLog", "TCPKeepAlive", "Compression",
  "ClientAliveInterval", "ClientAliveCountMax", "PermitUserEnvironment", "PermitTunnel", "MaxStartups", "Banner",
  "AcceptEnv", "Subsystem", "UseDNS", "PidFile", "AuthorizedKeysCommand", "AuthorizedKeysCommandUser",
  "TrustedUserCAKeys", "RevokedKeys", "AllowUsers", "DenyUsers", "AllowGroups", "DenyGroups", "Match", "Include",
  "ChrootDirectory", "ForceCommand", "PermitTTY", "PermitOpen", "PermitListen", "DisableForwarding", "ExposeAuthInfo",
  "RDomain", "SetEnv", "RequiredRSASize", "CASignatureAlgorithms", "HostbasedAcceptedAlgorithms",
  "PubkeyAcceptedAlgorithms", "KexAlgorithms", "Ciphers", "MACs", "RekeyLimit", "PerSourceMaxStartups",
  "PerSourceNetBlockSize", "LogVerbose", "AllowStreamLocalForwarding", "StreamLocalBindMask", "StreamLocalBindUnlink",
])

const BOOLEANS = new Set([
  "PermitRootLogin", "StrictModes", "PubkeyAuthentication", "HostbasedAuthentication", "IgnoreRhosts",
  "PermitEmptyPasswords", "PasswordAuthentication", "KerberosAuthentication", "UsePAM", "AllowAgentForwarding",
  "AllowTcpForwarding", "X11Forwarding", "X11UseLocalhost", "PrintMotd", "PrintLastLog", "TCPKeepAlive",
  "PermitUserEnvironment", "PermitTunnel", "UseDNS", "PermitTTY", "DisableForwarding", "ExposeAuthInfo", "LogVerbose",
])

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const seen = new Set<string>()
  const ports = new Set<number>()
  let match = ""
  let matchCount = 0

  if (text.trim().length === 0) issues.push({ code: "empty", severity: "error", message: "Document is empty" })

  text.split(/\r?\n/).forEach((raw, index) => {
    const lineNo = index + 1
    const line = raw.trim()
    if (!line || line.startsWith("#")) return
    const matchHeader = /^Match\s+(.+)$/i.exec(line)
    if (matchHeader) {
      const criteria = matchHeader[1].trim()
      const tokens = criteria.split(/\s+/)
      if (tokens.length < 2 || !/^(All|User|Group|Host|LocalAddress|LocalPort|Address|RDomain|invalid-user)$/i.test(tokens[0])) {
        issues.push({ code: "bad-match", severity: "error", message: `Invalid Match criteria: ${criteria}`, line: lineNo })
      }
      match = criteria
      matchCount += 1
      records.push({ id: `match:${matchCount}`, kind: "match", fields: { criteria, line: lineNo } })
      return
    }
    const directive = /^([A-Za-z][A-Za-z0-9]+)\s+(.+)$/.exec(line)
    if (!directive) {
      issues.push({ code: "bad-line", severity: "error", message: `Cannot parse line: ${line}`, line: lineNo })
      return
    }
    const keyword = directive[1]
    const value = directive[2].trim()
    if (!KNOWN.has(keyword)) issues.push({ code: "unknown-directive", severity: "warning", message: `Unknown directive ${keyword}`, line: lineNo })
    const singleton = `${match}|${keyword}`
    if (!["AllowUsers", "DenyUsers", "AllowGroups", "DenyGroups", "AcceptEnv", "SetEnv", "ListenAddress", "HostKey", "HostCertificate", "Include"].includes(keyword)) {
      if (seen.has(singleton)) issues.push({ code: "duplicate-directive", severity: "warning", message: `${keyword} is set more than once${match ? ` in Match ${match}` : ""}`, line: lineNo })
      seen.add(singleton)
    }
    if (keyword === "Port") {
      const port = Number(value)
      if (!Number.isInteger(port) || port < 1 || port > 65535) issues.push({ code: "bad-port", severity: "error", message: `Port must be 1-65535: ${value}`, line: lineNo })
      else ports.add(port)
    }
    if (BOOLEANS.has(keyword) && !/^(yes|no)$/i.test(value)) issues.push({ code: "bad-boolean", severity: "error", message: `${keyword} must be yes or no: ${value}`, line: lineNo })
    if (keyword === "PermitRootLogin" && !/^(yes|no|prohibit-password|forced-commands-only)$/i.test(value)) issues.push({ code: "bad-value", severity: "error", message: `PermitRootLogin must be yes, no, prohibit-password or forced-commands-only: ${value}`, line: lineNo })
    if (keyword === "LogLevel" && !/^(QUIET|FATAL|ERROR|INFO|VERBOSE|DEBUG|DEBUG1|DEBUG2|DEBUG3)$/i.test(value)) issues.push({ code: "bad-value", severity: "error", message: `Unknown LogLevel ${value}`, line: lineNo })
    if (["LoginGraceTime", "MaxAuthTries", "MaxSessions", "ClientAliveInterval", "ClientAliveCountMax", "X11DisplayOffset", "ServerKeyBits"].includes(keyword)) {
      if (!/^\d+$/.test(value)) issues.push({ code: "bad-number", severity: "error", message: `${keyword} must be numeric: ${value}`, line: lineNo })
    }
    records.push({ id: `directive:${records.length + 1}`, kind: "directive", fields: { keyword, value, match, line: lineNo } })
  })

  if (records.filter((record) => record.kind === "directive").length === 0) issues.push({ code: "no-directives", severity: "error", message: "No sshd directives found" })

  return { format: "sshd_config", records, meta: { directives: records.filter((record) => record.kind === "directive").length, matchBlocks: matchCount, ports: [...ports].join(",") }, issues }
}

const reference = [
  "OpenSSH sshd_config",
  "",
  "Port 22",
  "PermitRootLogin no",
  "PasswordAuthentication no",
  "PubkeyAuthentication yes",
  "AllowUsers alice bob",
  "",
  "Match User git",
  "    ForceCommand git-shell",
  "    PermitTTY no",
  "",
  "Directives are Keyword value lines.",
  "Boolean directives accept yes or no.",
  "Match starts a conditional block; later directives apply to it.",
].join("\n")

export const format: FormatModule = {
  slug: "sshd-config",
  displayName: "sshd_config",
  extensions: ["sshd_config", ".sshd_config"],
  description: "Parse sshd_config files, validate ports, booleans and Match blocks.",
  reference,
  parse,
  sample: () =>
    [
      "Port 22",
      "PermitRootLogin no",
      "PasswordAuthentication no",
      "PubkeyAuthentication yes",
      "AllowUsers alice bob",
      "",
      "Match User git",
      "    ForceCommand git-shell",
      "    PermitTTY no",
    ].join("\n") + "\n",
}
