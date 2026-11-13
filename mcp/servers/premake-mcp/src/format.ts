import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

function stripComments(text: string): string {
  return text.replace(/--\[\[[\s\S]*?\]\]/g, "").replace(/--[^\n]*/g, "")
}

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const source = stripComments(text)
  let workspace = ""
  let project = ""
  let projectKind = ""
  let projectFiles = 0
  const projects: Array<{ name: string; kind: string; files: number }> = []

  let depth = 0
  for (const char of source) {
    if (char === "{") depth += 1
    if (char === "}") depth -= 1
    if (depth < 0) {
      issues.push({ code: "unmatched-brace", severity: "error", message: "Closing } without an opening {" })
      depth = 0
      break
    }
  }
  if (depth > 0) issues.push({ code: "unclosed-brace", severity: "error", message: `${depth} brace(s) left unclosed` })

  source.split(/\r?\n/).forEach((raw, index) => {
    const number = index + 1
    const line = raw.trim()
    if (line.length === 0) return

    const ws = /^workspace\s+"([^"]+)"/.exec(line)
    if (ws) {
      workspace = ws[1]
      records.push({ id: `workspace:${workspace}`, kind: "workspace", fields: { name: workspace, line: number } })
      return
    }

    const prj = /^project\s+"([^"]+)"/.exec(line)
    if (prj) {
      if (project) projects.push({ name: project, kind: projectKind, files: projectFiles })
      project = prj[1]
      projectKind = ""
      projectFiles = 0
      records.push({ id: `project:${project}`, kind: "project", fields: { name: project, workspace, line: number } })
      return
    }

    const kind = /^kind\s+"([^"]+)"/.exec(line)
    if (kind) {
      projectKind = kind[1]
      if (!["ConsoleApp", "WindowedApp", "StaticLib", "SharedLib", "Utility", "Makefile", "None"].includes(projectKind)) {
        issues.push({ code: "unknown-kind", severity: "warning", message: `Unknown project kind: ${projectKind}`, line: number })
      }
      records.push({ id: `kind:${number}`, kind: "setting", fields: { key: "kind", value: projectKind, project } })
      return
    }

    const files = /^files\s*\{([\s\S]*?)\}/.exec(line)
    if (files) {
      const entries = [...files[1].matchAll(/"([^"]+)"/g)].map((match) => match[1])
      projectFiles += entries.length
      if (entries.length === 0) {
        issues.push({ code: "empty-files", severity: "error", message: "files { } lists no files", line: number })
      }
      records.push({ id: `files:${number}`, kind: "files", fields: { count: entries.length, first: entries[0] ?? "" } })
      return
    }

    const setting = /^([A-Za-z_]\w*)\s+"([^"]*)"/.exec(line)
    if (setting) {
      records.push({ id: `set:${setting[1]}:${number}`, kind: "setting", fields: { key: setting[1], value: setting[2], project } })
      return
    }

    if (/^[A-Za-z_]\w*\s*\{/.test(line) || /^\}/.test(line) || /^end$/.test(line)) return

    issues.push({ code: "unknown-statement", severity: "warning", message: `Not a premake statement: ${line.slice(0, 60)}`, line: number })
  })
  if (project) projects.push({ name: project, kind: projectKind, files: projectFiles })

  for (const entry of projects) {
    if (!entry.kind) {
      issues.push({ code: "project-without-kind", severity: "error", message: `Project ${entry.name} has no kind` })
    }
  }
  if (projects.length === 0) {
    issues.push({ code: "no-project", severity: "error", message: "Script declares no project" })
  }

  return {
    format: "Premake",
    records,
    meta: {
      workspace,
      projects: projects.length,
      settings: records.filter((record) => record.kind === "setting").length,
      files: projects.reduce((sum, entry) => sum + entry.files, 0),
    },
    issues,
  }
}

const reference = [
  "Premake5 Lua script (premake5.lua)",
  "",
  "workspace \"Name\"",
  "  configurations { \"Debug\", \"Release\" }",
  "project \"App\"",
  "  kind \"ConsoleApp\"",
  "  language \"C++\"",
  "  files { \"src/main.cpp\" }",
  "  targetdir \"bin\"",
  "",
  "Comments are -- to end of line, or --[[ ... ]] for blocks.",
  "Every project needs a kind.",
  "files { } must list at least one file.",
].join("\n")

export const format: FormatModule = {
  slug: "premake",
  displayName: "Premake",
  extensions: [".lua"],
  description: "Parse Premake scripts, validate projects, kinds and file lists.",
  reference,
  parse,
  sample: () =>
    [
      'workspace "Demo"',
      '  configurations { "Debug", "Release" }',
      "",
      'project "App"',
      '  kind "ConsoleApp"',
      '  language "C++"',
      '  files { "src/main.cpp" }',
    ].join("\n") + "\n",
}
