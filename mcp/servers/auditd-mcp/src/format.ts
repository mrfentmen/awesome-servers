import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

const ACTIONS = new Set(["always", "never"])
const FILTERS = new Set(["task", "exit", "user", "exclude"])
const PERMS = new Set(["r", "w", "x", "a"])

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const watches = new Set<string>()
  const keys = new Set<string>()
  let rules = 0
  let control = 0

  if (text.trim().length === 0) issues.push({ code: "empty", severity: "error", message: "Document is empty" })

  text.split(/\r?\n/).forEach((raw, index) => {
    const lineNo = index + 1
    const line = raw.trim()
    if (!line || line.startsWith("#")) return
    const tokens = line.split(/\s+/)
    const first = tokens[0]

    if (["-D", "--delete-all"].includes(first)) {
      if (tokens.length !== 1) issues.push({ code: "bad-delete", severity: "error", message: "-D takes no arguments", line: lineNo })
      control += 1
      records.push({ id: `control:${control}`, kind: "control", fields: { directive: "-D", line: lineNo } })
      return
    }

    if (["-b", "-f", "-e", "-r", "--backlog_wait_time"].includes(first)) {
      const value = tokens[1]
      if (!value || !/^\d+$/.test(value)) {
        issues.push({ code: "bad-control", severity: "error", message: `${first} needs a number`, line: lineNo })
      } else if (first === "-f" && !["0", "1", "2"].includes(value)) {
        issues.push({ code: "bad-failure", severity: "error", message: `-f must be 0, 1 or 2: ${value}`, line: lineNo })
      } else if (first === "-e" && !["0", "1", "2"].includes(value)) {
        issues.push({ code: "bad-enabled", severity: "error", message: `-e must be 0, 1 or 2: ${value}`, line: lineNo })
      } else if (["-b", "-r", "--backlog_wait_time"].includes(first) && Number(value) <= 0) {
        issues.push({ code: "bad-number", severity: "error", message: `${first} must be positive`, line: lineNo })
      }
      control += 1
      records.push({ id: `control:${control}`, kind: "control", fields: { directive: first, value: value ?? "", line: lineNo } })
      return
    }

    if (["-w", "-W"].includes(first)) {
      let path = ""
      let perms = ""
      let key = ""
      for (let i = 1; i < tokens.length; i++) {
        if (tokens[i] === "-p") perms = tokens[++i] ?? ""
        else if (tokens[i] === "-k") key = tokens[++i] ?? ""
        else if (!path) path = tokens[i]
        else issues.push({ code: "extra-token", severity: "error", message: `Unexpected token ${tokens[i]}`, line: lineNo })
      }
      if (!path || !path.startsWith("/")) issues.push({ code: "bad-path", severity: "error", message: "Watch path must be absolute", line: lineNo })
      if (!perms || !/^[rwxa]+$/.test(perms) || [...perms].some((letter) => !PERMS.has(letter))) {
        issues.push({ code: "bad-perms", severity: "error", message: `Watch permissions must use r, w, x, a: ${perms}`, line: lineNo })
      }
      if (key) {
        keys.add(key)
        if (key.length > 31) issues.push({ code: "long-key", severity: "warning", message: `Audit key is longer than 31 characters: ${key}`, line: lineNo })
      }
      const watchKey = `${first}:${path}:${perms}:${key}`
      if (watches.has(watchKey)) issues.push({ code: "duplicate-watch", severity: "warning", message: `Duplicate watch ${path}`, line: lineNo })
      watches.add(watchKey)
      rules += 1
      records.push({ id: `watch:${rules}`, kind: first === "-W" ? "watch-remove" : "watch", fields: { path, perms, key, line: lineNo } })
      return
    }

    if (first === "-a") {
      const [action, filter] = (tokens[1] ?? "").split(",")
      if (!ACTIONS.has(action)) issues.push({ code: "bad-action", severity: "error", message: `Action must be always or never: ${action ?? ""}`, line: lineNo })
      if (!FILTERS.has(filter)) issues.push({ code: "bad-filter", severity: "error", message: `Filter must be task, exit, user or exclude: ${filter ?? ""}`, line: lineNo })
      let syscalls = ""
      let key = ""
      let fieldCount = 0
      for (let i = 2; i < tokens.length; i++) {
        if (tokens[i] === "-F") {
          const field = tokens[++i] ?? ""
          if (!/^[A-Za-z0-9_]+\s*=\s*[^=]+$/.test(field) && !/^key\s*=/.test(field)) {
            issues.push({ code: "bad-field", severity: "error", message: `-F needs field=value: ${field}`, line: lineNo })
          }
          fieldCount += 1
        } else if (tokens[i] === "-S") {
          syscalls = tokens[++i] ?? ""
          if (!/^[A-Za-z0-9_,]+$/.test(syscalls)) issues.push({ code: "bad-syscall", severity: "error", message: `Invalid syscall list ${syscalls}`, line: lineNo })
        } else if (tokens[i] === "-k") {
          key = tokens[++i] ?? ""
          if (!key) issues.push({ code: "empty-key", severity: "error", message: "-k needs a key", line: lineNo })
        } else {
          issues.push({ code: "extra-token", severity: "error", message: `Unexpected token ${tokens[i]}`, line: lineNo })
        }
      }
      if (fieldCount === 0 && !syscalls) issues.push({ code: "no-condition", severity: "error", message: "Syscall rule needs -F or -S", line: lineNo })
      if (key) keys.add(key)
      rules += 1
      records.push({ id: `rule:${rules}`, kind: "syscall", fields: { action: action ?? "", filter: filter ?? "", syscalls, fields: fieldCount, key, line: lineNo } })
      return
    }

    issues.push({ code: "bad-line", severity: "error", message: `Unknown audit rule: ${line}`, line: lineNo })
  })

  if (rules === 0) issues.push({ code: "no-rules", severity: "error", message: "File has no audit rules" })

  return { format: "auditd", records, meta: { rules, control, keys: keys.size, watches: watches.size }, issues }
}

const reference = [
  "Linux audit rules",
  "",
  "-D",
  "-b 8192",
  "-w /etc/passwd -p wa -k identity",
  "-w /etc/shadow -p wa -k identity",
  "-a always,exit -F arch=b64 -S execve -F key=exec",
  "-a always,exit -F arch=b64 -S open,openat -F exit=-EACCES -k access",
  "",
  "Watch rules use -w path -p perms -k key.",
  "Syscall rules use -a action,filter with -F fields and/or -S syscalls.",
  "Permissions are the letters r, w, x and a.",
  "Audit keys are limited to 31 characters.",
].join("\n")

export const format: FormatModule = {
  slug: "auditd",
  displayName: "auditd",
  extensions: [".rules", "audit.rules"],
  description: "Parse Linux audit rules, validate watches, syscalls, permissions and keys.",
  reference,
  parse,
  sample: () =>
    [
      "-D",
      "-b 8192",
      "-f 2",
      "-w /etc/passwd -p wa -k identity",
      "-w /etc/shadow -p wa -k identity",
      "-a always,exit -F arch=b64 -S execve -F key=exec",
      "-a always,exit -F arch=b64 -S open,openat -F exit=-EACCES -k access",
    ].join("\n") + "\n",
}
