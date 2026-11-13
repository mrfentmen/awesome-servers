import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

const CAPABILITIES = new Set([
  "chown", "dac_override", "dac_read_search", "fowner", "fsetid", "kill", "setgid", "setuid", "setpcap",
  "linux_immutable", "net_bind_service", "net_broadcast", "net_admin", "net_raw", "ipc_lock", "ipc_owner",
  "sys_module", "sys_rawio", "sys_chroot", "sys_ptrace", "sys_pacct", "sys_admin", "sys_boot", "sys_nice",
  "sys_resource", "sys_time", "sys_tty_config", "mknod", "lease", "audit_write", "audit_control", "setfcap",
  "mac_override", "mac_admin", "syslog", "wake_alarm", "block_suspend", "audit_read", "perfmon", "bpf",
  "checkpoint_restore",
])

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  let profile = ""
  let profileLine = 0
  let depth = 0
  let rules = 0
  let includes = 0
  const files = new Set<string>()
  const capabilities = new Set<string>()

  if (text.trim().length === 0) issues.push({ code: "empty", severity: "error", message: "Document is empty" })

  text.split(/\r?\n/).forEach((raw, index) => {
    const lineNo = index + 1
    const line = raw.trim()
    if (!line) return
    if (line.startsWith("#include")) {
      includes += 1
      const target = line.replace(/^#include\s*/, "").replace(/^<|>$/g, "").replace(/^"|"$/g, "")
      if (!target) issues.push({ code: "bad-include", severity: "error", message: "#include needs a path", line: lineNo })
      records.push({ id: `include:${includes}`, kind: "include", fields: { target, line: lineNo } })
      return
    }
    if (line.startsWith("#")) return

    if (depth === 0) {
      const header = /^profile\s+([^\s{]+)\s*(.*?)\s*\{$/.exec(line)
      if (!header) {
        issues.push({ code: "bad-header", severity: "error", message: "Expected a profile header", line: lineNo })
        return
      }
      profile = header[1]
      profileLine = lineNo
      let extra = header[2].trim()
      const flags = /flags=\(([^)]*)\)/.exec(extra)
      if (flags) extra = extra.replace(flags[0], "").trim()
      if (extra && !/^(@?\{|\/|@)/.test(extra)) issues.push({ code: "bad-attachment", severity: "error", message: `Profile attachment must be absolute: ${extra}`, line: lineNo })
      depth = 1
      records.push({ id: `profile:${profile}`, kind: "profile", fields: { name: profile, attachment: extra, flags: flags?.[1] ?? "", line: lineNo } })
      return
    }

    if (line === "}") {
      depth = 0
      profile = ""
      return
    }
    if (line === "{") {
      issues.push({ code: "nested-block", severity: "error", message: "Nested profile blocks are not supported", line: lineNo })
      depth += 1
      return
    }

    const capability = /^capability\s+([a-z_]+)\s*,$/.exec(line)
    if (capability) {
      if (!CAPABILITIES.has(capability[1])) issues.push({ code: "bad-capability", severity: "error", message: `Unknown capability ${capability[1]}`, line: lineNo })
      capabilities.add(capability[1])
      rules += 1
      records.push({ id: `rule:${rules}`, kind: "capability", fields: { profile, capability: capability[1], line: lineNo } })
      return
    }

    const network = /^network(?:\s+([a-z0-9]+))?(?:\s+([a-z0-9]+))?\s*,$/.exec(line)
    if (network) {
      rules += 1
      records.push({ id: `rule:${rules}`, kind: "network", fields: { profile, family: network[1] ?? "", type: network[2] ?? "", line: lineNo } })
      return
    }

    const file = /^(audit\s+)?(deny\s+)?(@?[^\s,]+)\s+([a-z]+)\s*,$/.exec(line)
    if (file) {
      const path = file[3]
      const perms = file[4]
      if (!path.startsWith("/") && !path.startsWith("@")) issues.push({ code: "relative-path", severity: "error", message: `Rule path must be absolute or a variable: ${path}`, line: lineNo })
      if (!/^[rwxmaklcp]+$/.test(perms)) issues.push({ code: "bad-perms", severity: "error", message: `Invalid permissions ${perms}`, line: lineNo })
      files.add(path)
      rules += 1
      records.push({ id: `rule:${rules}`, kind: "file", fields: { profile, path, perms, deny: Boolean(file[2]), audit: Boolean(file[1]), line: lineNo } })
      return
    }

    if (/^(dbus|signal|ptrace|mount|pivot_root|unix|userns|io_uring|mqueue|change_profile|link|alias|rlimit|task)\b/.test(line)) {
      if (!line.endsWith(",")) issues.push({ code: "missing-comma", severity: "error", message: "Rule must end with a comma", line: lineNo })
      rules += 1
      records.push({ id: `rule:${rules}`, kind: "rule", fields: { profile, text: line.replace(/,$/, ""), line: lineNo } })
      return
    }

    issues.push({ code: "bad-rule", severity: "error", message: `Cannot parse rule: ${line}`, line: lineNo })
  })

  if (depth > 0) issues.push({ code: "unclosed-profile", severity: "error", message: `Profile ${profile || "block"} is never closed`, line: profileLine })
  if (records.filter((record) => record.kind === "profile").length === 0) issues.push({ code: "no-profile", severity: "error", message: "No profile found" })

  return {
    format: "AppArmor",
    records,
    meta: { profiles: records.filter((record) => record.kind === "profile").length, rules, includes, files: files.size, capabilities: capabilities.size },
    issues,
  }
}

const reference = [
  "AppArmor profile",
  "",
  "#include <tunables/global>",
  "",
  "profile demo /usr/bin/demo flags=(attach_disconnected) {",
  "  #include <abstractions/base>",
  "  capability net_bind_service,",
  "  network inet tcp,",
  "  /usr/bin/demo mr,",
  "  /etc/demo/** r,",
  "  deny /etc/shadow rw,",
  "}",
  "",
  "Rules end with a comma.",
  "File paths are absolute or start with an @ variable.",
  "Permissions use the letters r, w, x, m, a, k, l, c and p.",
].join("\n")

export const format: FormatModule = {
  slug: "apparmor",
  displayName: "AppArmor",
  extensions: [".profile", ".apparmor"],
  description: "Parse AppArmor profiles, validate capabilities, file rules and commas.",
  reference,
  parse,
  sample: () =>
    [
      "#include <tunables/global>",
      "",
      "profile demo /usr/bin/demo flags=(attach_disconnected) {",
      "  #include <abstractions/base>",
      "  capability net_bind_service,",
      "  network inet tcp,",
      "  /usr/bin/demo mr,",
      "  /etc/demo/** r,",
      "  deny /etc/shadow rw,",
      "}",
    ].join("\n") + "\n",
}
