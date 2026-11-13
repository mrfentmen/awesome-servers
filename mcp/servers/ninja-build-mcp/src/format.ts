import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const lines = text.split(/\r?\n/)
  const rules = new Set<string>()
  const variables = new Set<string>()
  const builds: Array<{ id: string; rule: string; line: number }> = []
  let current: { kind: "rule" | "build"; name: string } | null = null
  let ruleHasCommand = new Map<string, boolean>()

  lines.forEach((raw, index) => {
    const number = index + 1
    if (raw.trim().length === 0) {
      current = null
      return
    }
    if (raw.startsWith("#")) return

    if (raw.startsWith("\t")) {
      issues.push({ code: "tab-indent", severity: "error", message: "Ninja requires spaces for continuation, not tabs", line: number })
      return
    }

    if (raw.startsWith(" ")) {
      const binding = /^\s+([A-Za-z_][\w]*)\s*=\s*(.*)$/.exec(raw)
      if (!binding) {
        issues.push({ code: "bad-binding", severity: "error", message: `Indented line is not name = value: ${raw.trim().slice(0, 50)}`, line: number })
        return
      }
      const [, key, value] = binding
      if (current?.kind === "rule" && key === "command") {
        ruleHasCommand.set(current.name, value.trim().length > 0)
        if (value.trim().length === 0) {
          issues.push({ code: "empty-command", severity: "error", message: `Rule ${current.name} has an empty command`, line: number })
        }
      }
      records.push({ id: `binding:${number}`, kind: "binding", fields: { owner: current?.name ?? "", key, value: value.slice(0, 200) } })
      return
    }

    const rule = /^rule\s+([A-Za-z_][\w.-]*)\s*$/.exec(raw)
    if (rule) {
      const name = rule[1]
      if (rules.has(name)) {
        issues.push({ code: "duplicate-rule", severity: "error", message: `Rule ${name} is defined twice`, line: number })
      }
      rules.add(name)
      ruleHasCommand.set(name, false)
      current = { kind: "rule", name }
      records.push({ id: `rule:${name}`, kind: "rule", fields: { name, line: number } })
      return
    }

    const build = /^build\s+([^:]+):\s*([A-Za-z_][\w.-]*)\s*(.*)$/.exec(raw)
    if (build) {
      const outputs = build[1].trim()
      const ruleName = build[2]
      current = { kind: "build", name: outputs }
      builds.push({ id: `build:${outputs}`, rule: ruleName, line: number })
      records.push({
        id: `build:${outputs}`,
        kind: "build",
        fields: { outputs, rule: ruleName, inputs: build[3].trim().slice(0, 200), line: number },
      })
      return
    }

    const include = /^include\s+(\S+)\s*$/.exec(raw)
    if (include) {
      records.push({ id: `include:${include[1]}`, kind: "include", fields: { path: include[1] } })
      current = null
      return
    }

    const preset = /^default\s+(.+)$/.exec(raw)
    if (preset) {
      records.push({ id: `default:${number}`, kind: "default", fields: { targets: preset[1].trim() } })
      current = null
      return
    }

    const variable = /^([A-Za-z_][\w]*)\s*=\s*(.*)$/.exec(raw)
    if (variable) {
      variables.add(variable[1])
      records.push({ id: `var:${variable[1]}`, kind: "variable", fields: { name: variable[1], value: variable[2].slice(0, 200) } })
      current = null
      return
    }

    issues.push({ code: "unknown-statement", severity: "error", message: `Line is not valid ninja syntax: ${raw.trim().slice(0, 60)}`, line: number })
  })

  for (const rule of rules) {
    if (ruleHasCommand.get(rule) !== true) {
      issues.push({ code: "rule-without-command", severity: "error", message: `Rule ${rule} has no command binding` })
    }
  }
  for (const build of builds) {
    if (!rules.has(build.rule)) {
      issues.push({
        code: "unknown-rule",
        severity: "warning",
        message: `build ${build.id} uses rule ${build.rule}, which is not defined in this file`,
        line: build.line,
      })
    }
  }

  return {
    format: "Ninja build",
    records,
    meta: {
      rules: rules.size,
      builds: builds.length,
      variables: variables.size,
      includes: records.filter((record) => record.kind === "include").length,
    },
    issues,
  }
}

const reference = [
  "Ninja build file",
  "",
  "rule cc",
  "  command = cc -c $in -o $out",
  "build main.o: cc main.c",
  "build app: link main.o",
  "  ldflags = -lm",
  "default app",
  "include other.ninja",
  "",
  "Top level statements start in column one.",
  "Bindings under a rule or build are indented with two spaces.",
  "Every rule needs a non empty command.",
  "Tabs are not valid indentation.",
].join("\n")

export const format: FormatModule = {
  slug: "ninja-build",
  displayName: "Ninja build",
  extensions: [".ninja"],
  description: "Parse build.ninja files, validate rules and build statements.",
  reference,
  parse,
  sample: () =>
    [
      "cflags = -O2",
      "",
      "rule cc",
      "  command = cc $cflags -c $in -o $out",
      "",
      "rule link",
      "  command = cc $in -o $out",
      "",
      "build main.o: cc main.c",
      "build app: link main.o",
      "default app",
    ].join("\n") + "\n",
}
