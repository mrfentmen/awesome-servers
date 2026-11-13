import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

const CLASSES = new Set([
  "file", "dir", "process", "tcp_socket", "udp_socket", "rawip_socket", "node", "netif", "packet", "socket",
  "unix_stream_socket", "unix_dgram_socket", "fifo_file", "chr_file", "blk_file", "lnk_file", "sock_file", "sem",
  "msgq", "shm", "ipc", "capability", "security", "system", "kernel", "key", "netlink_socket", "netlink_route_socket",
  "netlink_firewall_socket", "netlink_tcpdiag_socket", "netlink_audit_socket", "netlink_selinux_socket", "peer",
  "association", "netmsg", "tun_socket", "icmp_socket", "appletalk_socket", "ax25_socket", "bluetooth_socket",
  "can_socket", "dccp_socket", "ipx_socket", "irda_socket", "llc_socket", "pppox_socket", "sctp_socket",
  "tipc_socket", "vsock_socket", "x25_socket", "binder", "mqueue", "io_uring", "bpf", "perf_event", "anon_inode",
])

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const types = new Set<string>()
  const attributes = new Set<string>()
  let moduleName = ""
  let version = ""
  let allowRules = 0
  let inRequire = false
  let braces = 0

  if (text.trim().length === 0) issues.push({ code: "empty", severity: "error", message: "Document is empty" })

  text.split(/\r?\n/).forEach((raw, index) => {
    const lineNo = index + 1
    const line = raw.replace(/#.*$/, "").trim()
    if (!line) return
    braces += (line.match(/\{/g) ?? []).length - (line.match(/\}/g) ?? []).length

    if (inRequire) {
      if (line === "}") {
        inRequire = false
        return
      }
      const declaration = /^(type|attribute)\s+([a-z_][\w]*)\s*;/.exec(line)
      if (declaration) {
        ;(declaration[1] === "type" ? types : attributes).add(declaration[2])
      }
      return
    }
    if (/^require\s*\{/.test(line)) {
      inRequire = true
      return
    }

    const module = /^policy_module\(([a-z_][\w]*),\s*([\w.]+)\)\s*;?/.exec(line)
    if (module) {
      moduleName = module[1]
      version = module[2]
      records.push({ id: `module:${moduleName}`, kind: "module", fields: { name: moduleName, version } })
      return
    }
    const type = /^type\s+([a-z_][\w]*)\s*;/.exec(line)
    if (type) {
      types.add(type[1])
      records.push({ id: `type:${type[1]}`, kind: "type", fields: { name: type[1] } })
      return
    }
    const attribute = /^attribute\s+([a-z_][\w]*)\s*;/.exec(line)
    if (attribute) {
      attributes.add(attribute[1])
      records.push({ id: `attribute:${attribute[1]}`, kind: "attribute", fields: { name: attribute[1] } })
      return
    }
    const typeattribute = /^typeattribute\s+([a-z_][\w]*)\s+([a-z_][\w]*)\s*;/.exec(line)
    if (typeattribute) {
      types.add(typeattribute[1])
      attributes.add(typeattribute[2])
      return
    }
    const permit = /^(allow|dontaudit|auditallow|neverallow)\s+(\S+)\s+(\S+):([a-z_][\w]*)\s+\{([^}]*)\}\s*;/.exec(line)
    const permitSingle = permit ? null : /^(allow|dontaudit|auditallow|neverallow)\s+(\S+)\s+(\S+):([a-z_][\w]*)\s+([a-z_][\w]*)\s*;/.exec(line)
    const rule = permit ?? permitSingle
    if (rule) {
      const kind = rule[1]
      const source = rule[2]
      const target = rule[3]
      const className = rule[4]
      const perms = (permit ? rule[5] : rule[5]).trim().split(/\s+/).filter(Boolean)
      if (!CLASSES.has(className)) issues.push({ code: "bad-class", severity: "error", message: `Unknown object class ${className}`, line: lineNo })
      for (const name of [source, target]) {
        if (name === "self" || name === "domain" || name === "unlabeled" || name === "any") continue
        if (!types.has(name) && !attributes.has(name)) issues.push({ code: "unknown-type", severity: "error", message: `${kind} references unknown type ${name}`, line: lineNo })
      }
      if (perms.length === 0) issues.push({ code: "no-perms", severity: "error", message: `${kind} rule has no permissions`, line: lineNo })
      allowRules += 1
      records.push({ id: `rule:${allowRules}`, kind, fields: { source, target, className, permissions: perms.join(" "), line: lineNo } })
      return
    }
    const transition = /^type_transition\s+(\S+)\s+(\S+):([a-z_][\w]*)\s+(\S+)\s*;/.exec(line)
    if (transition) {
      const newType = transition[4]
      if (!types.has(newType) && !attributes.has(newType)) issues.push({ code: "unknown-type", severity: "error", message: `type_transition creates unknown type ${newType}`, line: lineNo })
      records.push({ id: `transition:${records.length + 1}`, kind: "type_transition", fields: { source: transition[1], target: transition[2], className: transition[3], newType } })
      return
    }
    if (/^(interface|template|gen_require|optional_policy|tunable_policy|if|else|boolean|role|roleattribute|user|sid|portcon|nodecon|netifcon|fs_use|init_daemon_domain|files_type|permissive|typealias|gen_bool|corecmd_executable_file|logging_send_syslog_msg)\b/.test(line)) return
    if (line.endsWith(";") || line.endsWith("{") || line.endsWith("}")) return
    issues.push({ code: "bad-line", severity: "warning", message: `Unrecognised policy line: ${line}`, line: lineNo })
  })

  if (!moduleName) issues.push({ code: "no-module", severity: "error", message: "Missing policy_module declaration" })
  if (types.size === 0) issues.push({ code: "no-types", severity: "warning", message: "Policy declares no types" })
  if (inRequire) issues.push({ code: "unclosed-require", severity: "error", message: "require block is never closed" })
  if (braces !== 0) issues.push({ code: "unbalanced", severity: "error", message: `Unbalanced braces: ${braces}` })

  return { format: "SELinux policy", records, meta: { module: moduleName, version, types: types.size, attributes: attributes.size, rules: allowRules }, issues }
}

const reference = [
  "SELinux type enforcement policy",
  "",
  "policy_module(demo, 1.0)",
  "",
  "attribute demo_domain;",
  "type demo_t;",
  "type demo_exec_t;",
  "",
  "require {",
  "  type demo_t;",
  "  class tcp_socket { create_stream_socket_perms };",
  "}",
  "",
  "allow demo_t demo_exec_t:file { execute execute_no_trans };",
  "allow demo_t self:tcp_socket { create_stream_socket_perms };",
  "",
  "policy_module is required.",
  "allow rules need declared types and a known object class.",
  "Braces and require blocks must balance.",
].join("\n")

export const format: FormatModule = {
  slug: "selinux",
  displayName: "SELinux policy",
  extensions: [".te", ".if"],
  description: "Parse SELinux type enforcement policies, validate types, classes and rules.",
  reference,
  parse,
  sample: () =>
    [
      "policy_module(demo, 1.0)",
      "",
      "attribute demo_domain;",
      "type demo_t;",
      "type demo_exec_t;",
      "type demo_port_t;",
      "",
      "require {",
      "  type demo_t;",
      "  class tcp_socket { create_stream_socket_perms };",
      "}",
      "",
      "allow demo_t demo_exec_t:file { execute execute_no_trans };",
      "allow demo_t self:tcp_socket { create_stream_socket_perms };",
      "type_transition demo_t demo_exec_t:process demo_t;",
    ].join("\n") + "\n",
}
