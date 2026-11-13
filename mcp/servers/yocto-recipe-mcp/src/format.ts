import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

const ASSIGN = /^([A-Za-z_][\w+${}.:-]*)\s*(\?\?=|\?=|\+=|=\+|\.=|=\.|=)\s*(.*)$/

function unquote(value: string): string {
  const trimmed = value.trim()
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) return trimmed.slice(1, -1)
  return trimmed
}

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const seen = new Map<string, number>()
  let tasks = 0
  let inheritCount = 0

  text.split(/\r?\n/).forEach((raw, index) => {
    const number = index + 1
    const line = raw.trim()
    if (line.length === 0 || line.startsWith("#")) return

    const inherit = /^inherit(?:\s+(.*))?$/.exec(line)
    if (inherit) {
      const classes = (inherit[1] ?? "").trim().split(/\s+/).filter(Boolean)
      if (classes.length === 0) {
        issues.push({ code: "empty-inherit", severity: "error", message: "inherit needs at least one class", line: number })
      }
      inheritCount += classes.length
      records.push({ id: `inherit:${number}`, kind: "inherit", fields: { classes: classes.join(" ") } })
      return
    }

    const include = /^(include|require)\s+(.+)$/.exec(line)
    if (include) {
      const path = unquote(include[2]).replace(/\$\{[^}]+\}/g, "VAR")
      if (path.trim().length === 0) {
        issues.push({ code: "empty-include", severity: "error", message: `${include[1]} needs a path`, line: number })
      }
      records.push({ id: `include:${number}`, kind: include[1], fields: { path } })
      return
    }

    const task = /^([\w${}.:-]+)\s*\(\)\s*\{/.exec(line)
    if (task) {
      tasks += 1
      records.push({ id: `task:${task[1]}`, kind: "task", fields: { name: task[1], line: number } })
      return
    }

    const assign = ASSIGN.exec(line)
    if (assign) {
      const name = assign[1]
      const op = assign[2]
      const value = unquote(assign[3])
      const previous = seen.get(name)
      if (previous && (name === "LICENSE" || name === "SRC_URI")) {
        issues.push({
          code: "duplicate-variable",
          severity: "warning",
          message: `${name} is set twice (line ${previous} and ${number})`,
          line: number,
        })
      }
      seen.set(name, number)
      const opens = (value.match(/\$\{/g) ?? []).length
      const closes = (value.match(/\}/g) ?? []).length
      if (opens !== closes) {
        issues.push({ code: "bad-expansion", severity: "error", message: `${name} has unbalanced \${ } expansion`, line: number })
      }
      if (name === "SRC_URI" && value.length > 0) {
        for (const entry of value.split(/\s+/)) {
          if (entry.includes("://")) continue
          if (entry.startsWith("file://") || entry.startsWith("git://") || entry.startsWith("gitsm://")) continue
          issues.push({ code: "src-uri-scheme", severity: "warning", message: `SRC_URI entry has no scheme: ${entry}`, line: number })
        }
      }
      records.push({ id: `var:${name}`, kind: "variable", fields: { name, op, value: value.slice(0, 200), line: number } })
      return
    }

    if (/^\}$/.test(line)) return
    if (/^\s/.test(raw)) return

    issues.push({ code: "unknown-line", severity: "warning", message: `Not a recipe statement: ${line.slice(0, 60)}`, line: number })
  })

  for (const required of ["SUMMARY", "LICENSE"]) {
    if (!seen.has(required)) {
      issues.push({ code: "missing-required", severity: "warning", message: `Recipe has no ${required}` })
    }
  }

  return {
    format: "Yocto recipe",
    records,
    meta: {
      variables: records.filter((record) => record.kind === "variable").length,
      tasks,
      inherit: inheritCount,
      includes: records.filter((record) => record.kind === "include" || record.kind === "require").length,
      license: records.find((record) => record.id === "var:LICENSE")?.fields.value ?? "",
    },
    issues,
  }
}

const reference = [
  "Yocto / BitBake recipe (.bb, .bbappend, .inc)",
  "",
  "SUMMARY = \"what it is\"",
  "LICENSE = \"MIT\"",
  "SRC_URI = \"https://example.com/app-1.0.tar.gz\"",
  "S = \"${WORKDIR}/app-1.0\"",
  "inherit autotools pkgconfig",
  "do_install() {",
  "    install -d ${D}${bindir}",
  "}",
  "",
  "Operators: = set, ?= default, ??= weak default, += append, =+ prepend, .= and =. join.",
  "include and require pull in another file; require fails if missing.",
].join("\n")

export const format: FormatModule = {
  slug: "yocto-recipe",
  displayName: "Yocto recipe",
  extensions: [".bb", ".bbappend", ".inc"],
  description: "Parse Yocto/BitBake recipes, validate variables, tasks and SRC_URI.",
  reference,
  parse,
  regressions: [{ doc: 'LICENSE = "MIT"\ninherit\n', expectError: "inherit needs at least one class" }],
  sample: () =>
    [
      'SUMMARY = "Demo recipe"',
      'LICENSE = "MIT"',
      'SRC_URI = "https://example.com/demo-1.0.tar.gz"',
      'S = "${WORKDIR}/demo-1.0"',
      "",
      "inherit autotools pkgconfig",
      "",
      "do_install() {",
      "    install -d ${D}${bindir}",
      "}",
    ].join("\n") + "\n",
}
