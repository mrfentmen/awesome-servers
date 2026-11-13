import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

type Ref = { name: string; kind: string; line: number }

const ALIAS_TYPES: Record<string, string> = {
  User_Alias: "user",
  Host_Alias: "host",
  Cmnd_Alias: "command",
  Runas_Alias: "runas",
}

function isAlias(name: string): boolean {
  return /^[A-Z][A-Z0-9_]*$/.test(name) && name !== "ALL"
}

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const aliases = new Map<string, Set<string>>()
  const refs: Ref[] = []
  const logical: string[] = []
  let buffer = ""

  if (text.trim().length === 0) issues.push({ code: "empty", severity: "error", message: "Document is empty" })

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line && !buffer) continue
    buffer += buffer ? ` ${line}` : line
    if (buffer.endsWith("\\")) {
      buffer = buffer.slice(0, -1).trim()
      continue
    }
    logical.push(buffer)
    buffer = ""
  }
  if (buffer) logical.push(buffer)

  let userSpecs = 0
  let defaults = 0
  let includes = 0

  logical.forEach((raw, index) => {
    const lineNo = index + 1
    const line = raw.trim()
    if (!line || line.startsWith("#")) return

    if (/^#include(dir)?\s+/.test(line)) {
      includes += 1
      const target = line.replace(/^#include(dir)?\s+/, "").trim()
      if (!target) issues.push({ code: "bad-include", severity: "error", message: "#include needs a path", line: lineNo })
      records.push({ id: `include:${includes}`, kind: "include", fields: { target, line: lineNo } })
      return
    }

    if (/^Defaults\b/.test(line)) {
      const rest = line.replace(/^Defaults/, "").trim()
      if (!rest) issues.push({ code: "empty-defaults", severity: "error", message: "Defaults line has no parameters", line: lineNo })
      defaults += 1
      records.push({ id: `defaults:${defaults}`, kind: "defaults", fields: { parameters: rest, line: lineNo } })
      return
    }

    const alias = /^(User_Alias|Host_Alias|Cmnd_Alias|Runas_Alias)\s+([A-Z][A-Z0-9_]*)\s*=\s*(.+)$/.exec(line)
    if (alias) {
      const kind = ALIAS_TYPES[alias[1]]
      const name = alias[2]
      if (aliases.has(name)) issues.push({ code: "duplicate-alias", severity: "error", message: `Alias ${name} is defined twice`, line: lineNo })
      const items = alias[3].split(",").map((item) => item.trim()).filter(Boolean)
      if (items.length === 0) issues.push({ code: "empty-alias", severity: "error", message: `Alias ${name} has no members`, line: lineNo })
      for (const item of items) {
        const first = item.replace(/^!/, "").split(/\s+/)[0]
        if (isAlias(first)) refs.push({ name: first, kind, line: lineNo })
      }
      aliases.set(name, new Set(items))
      records.push({ id: `alias:${name}`, kind: "alias", fields: { name, aliasType: kind, members: items.join(","), count: items.length, line: lineNo } })
      return
    }

    const eq = line.indexOf("=")
    if (eq < 0) {
      issues.push({ code: "bad-line", severity: "error", message: "Expected Defaults, an Alias or a user specification", line: lineNo })
      return
    }
    const left = line.slice(0, eq).trim()
    const right = line.slice(eq + 1).trim()
    const leftParts = left.split(/\s+/)
    if (leftParts.length < 2) {
      issues.push({ code: "bad-spec", severity: "error", message: "User specification needs a user list and a host list", line: lineNo })
      return
    }
    const users = leftParts[0]
    const hosts = leftParts.slice(1).join(" ")
    let rest = right
    let runas = ""
    const runasMatch = /^\(([^)]*)\)\s*(.*)$/.exec(rest)
    if (runasMatch) {
      runas = runasMatch[1]
      rest = runasMatch[2]
    }
    let tags = ""
    const tagMatch = /^((?:NOPASSWD|PASSWD|NOEXEC|EXEC|SETENV|NOSETENV|LOG_INPUT|NOLOG_INPUT|LOG_OUTPUT|NOLOG_OUTPUT|MAIL|NOMAIL|FOLLOW|NOFOLLOW|INTERCEPT|NOINTERCEPT):\s*)+/i.exec(rest)
    if (tagMatch) {
      tags = tagMatch[0].trim()
      rest = rest.slice(tagMatch[0].length)
    }
    const commands = rest.split(",").map((command) => command.trim()).filter(Boolean)
    if (commands.length === 0) issues.push({ code: "no-commands", severity: "error", message: "User specification has no commands", line: lineNo })
    if (!runas) runas = "root"
    for (const command of commands) {
      const base = command.replace(/^!/, "").replace(/^(?:NOPASSWD|PASSWD|NOEXEC|EXEC|SETENV|NOSETENV):/i, "").trim().split(/\s+/)[0]
      if (base === "ALL" || base.startsWith("/") || base === "sudoedit") continue
      if (isAlias(base)) {
        refs.push({ name: base, kind: "command", line: lineNo })
        continue
      }
      issues.push({ code: "bad-command", severity: "error", message: `Command must start with /: ${base}`, line: lineNo })
    }
    for (const user of users.split(",").map((value) => value.trim()).filter(Boolean)) {
      const clean = user.replace(/^[%+#]/, "").replace(/^!/, "")
      if (isAlias(clean)) refs.push({ name: clean, kind: "user", line: lineNo })
    }
    for (const host of hosts.split(",").map((value) => value.trim()).filter(Boolean)) {
      const clean = host.replace(/^!/, "")
      if (isAlias(clean)) refs.push({ name: clean, kind: "host", line: lineNo })
    }
    for (const entry of runas.split(/[:,]/).map((value) => value.trim()).filter(Boolean)) {
      if (isAlias(entry)) refs.push({ name: entry, kind: "runas", line: lineNo })
    }
    userSpecs += 1
    records.push({
      id: `spec:${userSpecs}`,
      kind: "user-spec",
      fields: { users, hosts, runas, tags: tags || "none", commands: commands.join(","), line: lineNo },
    })
  })

  for (const ref of refs) {
    if (!aliases.has(ref.name)) {
      issues.push({ code: "unknown-alias", severity: "error", message: `Unknown ${ref.kind} alias ${ref.name}`, line: ref.line })
    }
  }
  if (userSpecs === 0) issues.push({ code: "no-specs", severity: "error", message: "No user specifications found" })

  return { format: "sudoers", records, meta: { aliases: aliases.size, userSpecs, defaults, includes }, issues }
}

const reference = [
  "sudoers",
  "",
  "Defaults env_reset",
  "User_Alias ADMINS = alice, bob",
  "Cmnd_Alias SERVICES = /usr/bin/systemctl restart sshd, /usr/bin/systemctl status sshd",
  "ADMINS ALL=(root) NOPASSWD: SERVICES",
  "%wheel ALL=(ALL:ALL) ALL",
  "",
  "Aliases start with an uppercase letter and are defined before use is recommended.",
  "A user specification is: users hosts = (runas) commands.",
  "Commands must be absolute paths, ALL or a Cmnd_Alias.",
  "Tags such as NOPASSWD: go before the command list.",
].join("\n")

export const format: FormatModule = {
  slug: "sudoers",
  displayName: "sudoers",
  extensions: ["sudoers", ".sudoers"],
  description: "Parse sudoers policy, validate aliases, user specs and command paths.",
  reference,
  parse,
  sample: () =>
    [
      "Defaults env_reset",
      'Defaults secure_path="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"',
      "User_Alias ADMINS = alice, bob",
      "Cmnd_Alias SERVICES = /usr/bin/systemctl restart sshd, /usr/bin/systemctl status sshd",
      "ADMINS ALL=(root) NOPASSWD: SERVICES",
      "%wheel ALL=(ALL:ALL) ALL",
    ].join("\n") + "\n",
}
