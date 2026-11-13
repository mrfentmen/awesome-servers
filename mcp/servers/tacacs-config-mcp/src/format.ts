import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

interface Block {
  type: "user" | "group" | "service"
  name: string
  owner: string
  line: number
  fields: Map<string, string>
}

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const stack: Block[] = []
  const users = new Set<string>()
  const groups = new Set<string>()
  let key = ""
  let keyLine = 0
  let services = 0

  if (text.trim().length === 0) issues.push({ code: "empty", severity: "error", message: "Document is empty" })

  text.split(/\r?\n/).forEach((raw, index) => {
    const lineNo = index + 1
    const line = raw.trim()
    if (!line || line.startsWith("#")) return

    if (stack.length === 0) {
      const keyMatch = /^key\s*=\s*(?:"([^"]*)"|(\S+))$/.exec(line)
      if (keyMatch) {
        key = keyMatch[1] ?? keyMatch[2]
        keyLine = lineNo
        records.push({ id: "key", kind: "key", fields: { present: true, line: lineNo } })
        return
      }
    }

    const block = /^(user|group|service)\s*=\s*([A-Za-z0-9_.-]+)\s*\{$/.exec(line)
    if (block) {
      const type = block[1] as Block["type"]
      if (type === "service" && !stack.some((entry) => entry.type === "user" || entry.type === "group")) {
        issues.push({ code: "orphan-service", severity: "error", message: "service block must be inside a user or group", line: lineNo })
      }
      if (type !== "service" && stack.length > 0) {
        issues.push({ code: "nested-user", severity: "error", message: `${type} block cannot be nested`, line: lineNo })
      }
      const owner = type === "service" ? stack[stack.length - 1]?.name ?? "" : ""
      stack.push({ type, name: block[2], owner, line: lineNo, fields: new Map() })
      if (type === "user") {
        if (users.has(block[2])) issues.push({ code: "duplicate-user", severity: "error", message: `Duplicate user ${block[2]}`, line: lineNo })
        users.add(block[2])
      }
      if (type === "group") {
        if (groups.has(block[2])) issues.push({ code: "duplicate-group", severity: "error", message: `Duplicate group ${block[2]}`, line: lineNo })
        groups.add(block[2])
      }
      if (type === "service") services += 1
      return
    }

    if (line === "}") {
      const closed = stack.pop()
      if (!closed) {
        issues.push({ code: "stray-close", severity: "error", message: "Closing brace without a block", line: lineNo })
        return
      }
      if (closed.type !== "service" && !closed.fields.has("login") && !closed.fields.has("member")) {
        issues.push({ code: "no-login", severity: "warning", message: `${closed.type} ${closed.name} has no login or member`, line: closed.line })
      }
      records.push({
        id: `${closed.type}:${closed.name}`,
        kind: closed.type,
        fields: {
          name: closed.name,
          owner: closed.owner,
          login: closed.fields.get("login") ?? "",
          member: closed.fields.get("member") ?? "",
          fields: closed.fields.size,
          line: closed.line,
        },
      })
      return
    }

    const assignment = /^([A-Za-z_][\w.-]*|default service)\s*=\s*(.+)$/.exec(line)
    if (assignment) {
      if (stack.length === 0) {
        issues.push({ code: "no-block", severity: "error", message: "Assignment outside a user or group block", line: lineNo })
        return
      }
      const current = stack[stack.length - 1]
      const value = assignment[2].trim().replace(/^"(.*)"$/, "$1")
      if (!value) issues.push({ code: "empty-value", severity: "error", message: `${assignment[1]} has no value`, line: lineNo })
      if (current.fields.has(assignment[1])) issues.push({ code: "duplicate-key", severity: "warning", message: `${assignment[1]} appears twice in ${current.type} ${current.name}`, line: lineNo })
      current.fields.set(assignment[1], value)
      records.push({
        id: `setting:${current.type}:${current.name}:${assignment[1]}`,
        kind: "setting",
        fields: { block: `${current.type} ${current.name}`, key: assignment[1], value, line: lineNo },
      })
      return
    }

    issues.push({ code: "bad-line", severity: "error", message: `Cannot parse line: ${line}`, line: lineNo })
  })

  for (const open of stack) issues.push({ code: "unclosed", severity: "error", message: `${open.type} ${open.name} is never closed`, line: open.line })
  if (!key) issues.push({ code: "no-key", severity: "error", message: "Missing global key", line: keyLine || undefined })
  if (users.size === 0 && groups.size === 0) issues.push({ code: "no-principals", severity: "error", message: "No user or group blocks found" })

  return {
    format: "TACACS+ config",
    records,
    meta: { keyPresent: Boolean(key), users: users.size, groups: groups.size, services },
    issues,
  }
}

const reference = [
  "tac_plus configuration",
  "",
  'key = "s3cret"',
  "",
  "user = alice {",
  '    login = cleartext "pw"',
  "    service = exec {",
  "        priv-lvl = 15",
  "    }",
  "}",
  "",
  "group = admins {",
  "    default service = permit",
  "}",
  "",
  "A global key is required.",
  "user and group blocks must not be nested.",
  "service blocks belong inside a user or group.",
].join("\n")

export const format: FormatModule = {
  slug: "tacacs-config",
  displayName: "TACACS+ config",
  extensions: [".tacacs", "tac_plus.conf"],
  description: "Parse tac_plus configs, validate keys, users, groups and service blocks.",
  reference,
  parse,
  sample: () =>
    [
      'key = "s3cret"',
      "",
      "user = alice {",
      '    login = cleartext "pw"',
      "    service = exec {",
      "        priv-lvl = 15",
      "    }",
      "}",
      "",
      "group = admins {",
      "    default service = permit",
      "}",
    ].join("\n") + "\n",
}
