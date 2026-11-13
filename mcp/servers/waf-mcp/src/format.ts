import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const source = text.replace(/#[^\n]*/g, "")
  const functions = new Set<string>()
  let current: { name: string; indent: number } | null = null

  source.split(/\r?\n/).forEach((raw, index) => {
    const number = index + 1
    if (raw.trim().length === 0) return

    const def = /^def\s+([A-Za-z_]\w*)\s*\(([^)]*)\)\s*:/.exec(raw)
    if (def) {
      current = { name: def[1], indent: raw.search(/\S/) }
      functions.add(def[1])
      records.push({ id: `def:${def[1]}`, kind: "function", fields: { name: def[1], params: def[2].trim(), line: number } })
      return
    }

    const indent = raw.search(/\S/)
    if (current && indent <= current.indent && /^\S/.test(raw)) current = null

    const call = /^\s*([A-Za-z_]\w*)\.([A-Za-z_]\w*)\s*\(([\s\S]*)\)\s*$/.exec(raw)
    if (call) {
      const receiver = call[1]
      const method = call[2]
      const args = call[3]
      const named: Record<string, string> = {}
      for (const match of args.matchAll(/([A-Za-z_]\w*)\s*=\s*('[^']*'|"[^"]*"|[\w.]+)/g)) {
        named[match[1]] = match[2].replace(/^['"]|['"]$/g, "")
      }
      if (method === "program" || method === "stlib" || method === "shlib") {
        if (!named.target) {
          issues.push({ code: "missing-target", severity: "error", message: `${method}() has no target=`, line: number })
        }
        if (!named.source && !named.features) {
          issues.push({ code: "missing-source", severity: "warning", message: `${method}() has no source=`, line: number })
        }
      }
      records.push({
        id: `call:${receiver}.${method}:${number}`,
        kind: "call",
        fields: { receiver, method, target: named.target ?? "", source: named.source ?? "", line: number },
      })
      return
    }

    if (/^\s*(import|from)\s/.test(raw)) {
      records.push({ id: `import:${number}`, kind: "import", fields: { raw: raw.trim() } })
      return
    }
    if (/^\s+(if|for|while|with|try|return|raise|pass)\b/.test(raw)) return
    if (/^\s*[)\]}]+/.test(raw)) return
  })

  for (const required of ["configure", "build"]) {
    if (!functions.has(required)) {
      issues.push({ code: "missing-function", severity: "error", message: `wscript has no ${required}() function` })
    }
  }
  if (!functions.has("options")) {
    issues.push({ code: "no-options", severity: "warning", message: "wscript has no options() function" })
  }

  return {
    format: "Waf",
    records,
    meta: {
      functions: functions.size,
      calls: records.filter((record) => record.kind === "call").length,
      targets: records.filter((record) => typeof record.fields.target === "string" && record.fields.target.length > 0).length,
    },
    issues,
  }
}

const reference = [
  "Waf wscript (Python)",
  "",
  "def options(opt):",
  "    opt.load('compiler_cxx')",
  "",
  "def configure(conf):",
  "    conf.load('compiler_cxx')",
  "",
  "def build(bld):",
  "    bld.program(source='main.cpp', target='app')",
  "",
  "configure() and build() are required.",
  "program(), stlib() and shlib() need target=.",
  "Comments start with #.",
].join("\n")

export const format: FormatModule = {
  slug: "waf",
  displayName: "Waf",
  extensions: ["wscript"],
  description: "Parse Waf wscript files, validate build functions and targets.",
  reference,
  parse,
  sample: () =>
    [
      "def options(opt):",
      "    opt.load('compiler_cxx')",
      "",
      "def configure(conf):",
      "    conf.load('compiler_cxx')",
      "",
      "def build(bld):",
      "    bld.program(source='main.cpp', target='app')",
    ].join("\n") + "\n",
}
