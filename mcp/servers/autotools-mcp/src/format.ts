import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

function bracketBalance(value: string): number {
  let depth = 0
  for (const char of value) {
    if (char === "[") depth += 1
    if (char === "]") depth -= 1
  }
  return depth
}

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const rawLines = text.split(/\r?\n/)

  const isConfigure = /(^|\n)\s*(AC_|AM_|LT_|IT_)/.test(text) || /AC_INIT|AC_PREREQ|AC_CONFIG/.test(text)
  const dialect = isConfigure ? "configure.ac" : "Makefile.am"

  let depth = 0
  let pending = ""
  let pendingLine = 0
  let hasInit = false
  let hasOutput = false

  rawLines.forEach((raw, index) => {
    const number = index + 1
    const line = raw.replace(/#.*$/, "").trimEnd()
    if (line.trim().length === 0) return

    if (line.includes("[") || line.includes("]")) {
      depth += bracketBalance(line)
      if (depth < 0) {
        issues.push({ code: "unmatched-bracket", severity: "error", message: "Closing ] without an opening [", line: number })
        depth = 0
      }
    }

    if (pending.length > 0) pending = `${pending} ${line.trim()}`
    else {
      pending = line.trim()
      pendingLine = number
    }
    if (pending.endsWith("\\")) {
      pending = pending.slice(0, -1)
      return
    }

    const macro = /^([A-Z][A-Z0-9_]+)\s*\((.*)\)\s*$/.exec(pending)
    if (macro) {
      const name = macro[1]
      if (name === "AC_INIT") hasInit = true
      if (name === "AC_OUTPUT") hasOutput = true
      records.push({ id: `macro:${name}:${records.length + 1}`, kind: "macro", fields: { name, args: macro[2].slice(0, 200), line: pendingLine } })
      pending = ""
      return
    }

    const variable = /^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(pending)
    if (variable) {
      const name = variable[1]
      const value = variable[2].trim()
      if (/_SOURCES$/.test(name) && value.length === 0) {
        issues.push({ code: "empty-sources", severity: "error", message: `${name} is empty`, line: pendingLine })
      }
      records.push({ id: `var:${name}`, kind: "variable", fields: { name, value: value.slice(0, 200), line: pendingLine } })
      pending = ""
      return
    }

    if (!/^[A-Za-z_][\w+.-]*\s*\+?=/.test(pending)) {
      issues.push({ code: "loose-line", severity: "warning", message: `Line is not a macro or assignment: ${pending.slice(0, 60)}`, line: pendingLine })
    }
    pending = ""
  })

  if (pending.length > 0) {
    issues.push({ code: "trailing-content", severity: "warning", message: `Last statement has no terminator: ${pending.slice(0, 60)}`, line: pendingLine })
  }
  if (depth !== 0) {
    issues.push({ code: "unbalanced-brackets", severity: "error", message: `Bracket depth ends at ${depth}` })
  }
  if (isConfigure && !hasInit) {
    issues.push({ code: "missing-ac-init", severity: "error", message: "configure.ac must call AC_INIT" })
  }
  if (isConfigure && !hasOutput) {
    issues.push({ code: "missing-ac-output", severity: "warning", message: "configure.ac has no AC_OUTPUT" })
  }

  return {
    format: `Autotools (${dialect})`,
    records,
    meta: {
      dialect,
      macros: records.filter((record) => record.kind === "macro").length,
      variables: records.filter((record) => record.kind === "variable").length,
      hasInit,
      hasOutput,
    },
    issues,
  }
}

const reference = [
  "GNU Autotools build files",
  "",
  "configure.ac uses m4 macros:",
  "  AC_INIT([name],[version],[bugs])",
  "  AM_INIT_AUTOMAKE([-Wall foreign])",
  "  AC_PROG_CC",
  "  AC_CONFIG_FILES([Makefile])",
  "  AC_OUTPUT",
  "Makefile.am uses variables:",
  "  bin_PROGRAMS = app",
  "  app_SOURCES = main.c util.c",
  "  SUBDIRS = lib tests",
  "Square brackets group arguments; they must balance.",
  "A trailing backslash continues a line.",
].join("\n")

export const format: FormatModule = {
  slug: "autotools",
  displayName: "Autotools",
  extensions: [".ac", ".am"],
  description: "Parse configure.ac and Makefile.am, validate macros and assignments.",
  reference,
  parse,
  regressions: [{ doc: "AC_PROG_CC\n", expectError: "configure.ac must call AC_INIT" }],
  sample: () =>
    [
      "AC_PREREQ([2.69])",
      "AC_INIT([demo],[1.0],[bugs@example.com])",
      "AM_INIT_AUTOMAKE([-Wall foreign])",
      "AC_PROG_CC",
      "AC_CONFIG_FILES([Makefile])",
      "AC_OUTPUT",
    ].join("\n") + "\n",
}
