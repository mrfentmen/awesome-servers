import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const classes = new Set<string>()
  let moduleName = ""
  let imports = 0
  let properties = 0
  let depth = 0

  for (const [index, raw] of text.split(/\r?\n/).entries()) {
    const line = raw.trim()
    if (!line || line.startsWith("//")) continue
    const lineNo = index + 1
    const bare = line.replace(/"[^"]*"/g, "\"\"")

    const moduleMatch = /^module\s+([A-Za-z_][\w.]*)/.exec(line)
    if (moduleMatch) {
      moduleName = moduleMatch[1]
      records.push({ id: "module", kind: "module", fields: { name: moduleName, line: lineNo } })
      continue
    }
    const importMatch = /^import\s+"([^"]+)"/.exec(line)
    if (importMatch) {
      imports += 1
      records.push({ id: `import:${imports}`, kind: "import", fields: { path: importMatch[1], line: lineNo } })
      continue
    }
    const classMatch = /^class\s+([A-Za-z_]\w*)/.exec(line)
    if (classMatch) {
      const name = classMatch[1]
      if (classes.has(name)) issues.push({ code: "duplicate-class", severity: "error", message: `class ${name} appears twice`, line: lineNo })
      classes.add(name)
      records.push({ id: `class:${name}`, kind: "class", fields: { name, line: lineNo } })
    } else if (/^[A-Za-z_]\w*\s*=/.test(line)) {
      properties += 1
      records.push({ id: `property:${properties}`, kind: "property", fields: { name: line.split("=")[0].trim(), line: lineNo } })
    }

    depth += (bare.match(/\{/g) ?? []).length - (bare.match(/\}/g) ?? []).length
    if (depth < 0) {
      issues.push({ code: "unbalanced", severity: "error", message: "Closing brace without opening brace", line: lineNo })
      depth = 0
    }
  }

  if (!moduleName) issues.push({ code: "no-module", severity: "error", message: "File has no module declaration" })
  if (depth !== 0) issues.push({ code: "unbalanced", severity: "error", message: `${depth} block(s) are not closed` })
  if (classes.size === 0 && properties === 0) {
    issues.push({ code: "no-content", severity: "warning", message: "File has no class or property" })
  }

  return {
    format: "Pkl",
    records,
    meta: { module: moduleName, imports, classes: classes.size, properties },
    issues,
  }
}

const reference = [
  "Pkl configuration",
  "",
  "module demo",
  'import "pkl:json"',
  "class Server {",
  '  host = "localhost"',
  "  port = 8080",
  "}",
  "",
  "The first declaration is module.",
  "Braces must balance.",
  "Class names are unique.",
].join("\n")

export const format: FormatModule = {
  slug: "pkl",
  displayName: "Pkl",
  extensions: [".pkl"],
  description: "Parse Pkl configs, validate modules, imports, classes and braces.",
  reference,
  parse,
  sample: () =>
    [
      "module demo",
      'import "pkl:json"',
      "class Server {",
      '  host = "localhost"',
      "  port = 8080",
      "}",
    ].join("\n") + "\n",
}
