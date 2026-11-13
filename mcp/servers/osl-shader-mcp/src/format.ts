import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

const TYPES = new Set(["float", "int", "color", "vector", "point", "normal", "matrix", "string", "void", "closure"])

function stripComments(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "")
}

function splitParams(body: string): string[] {
  const out: string[] = []
  let depth = 0
  let current = ""
  for (const char of body) {
    if (char === "(") depth += 1
    if (char === ")") depth -= 1
    if (char === "," && depth === 0) {
      out.push(current)
      current = ""
      continue
    }
    current += char
  }
  if (current.trim().length > 0) out.push(current)
  return out
}

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const source = stripComments(text)

  let depth = 0
  for (const char of source) {
    if (char === "{") depth += 1
    if (char === "}") depth -= 1
    if (depth < 0) {
      issues.push({ code: "unmatched-brace", severity: "error", message: "Closing brace without an opening brace" })
      depth = 0
      break
    }
  }
  if (depth > 0) issues.push({ code: "unclosed-brace", severity: "error", message: `${depth} brace(s) left unclosed` })

  for (const match of source.matchAll(/#include\s+"([^"]+)"/g)) {
    records.push({ id: `include:${match[1]}`, kind: "include", fields: { path: match[1] } })
  }

  const shaderRe = /shader\s+([A-Za-z_]\w*)\s*\(([\s\S]*?)\)\s*\{/g
  const seen = new Set<string>()
  let match: RegExpExecArray | null
  while ((match = shaderRe.exec(source)) !== null) {
    const name = match[1]
    if (seen.has(name)) {
      issues.push({ code: "duplicate-shader", severity: "error", message: `Shader ${name} is declared twice` })
    }
    seen.add(name)

    const params = splitParams(match[2])
    records.push({ id: `shader:${name}`, kind: "shader", fields: { name, params: params.length } })

    for (const param of params) {
      const parts = param.trim().split(/\s+/)
      if (parts.length < 2) {
        issues.push({ code: "bad-parameter", severity: "error", message: `Shader ${name} has a parameter without a name: ${param.trim()}` })
        continue
      }
      const type = parts[0]
      if (!TYPES.has(type)) {
        issues.push({ code: "unknown-type", severity: "warning", message: `Shader ${name} parameter uses type ${type}` })
      }
      records.push({
        id: `param:${name}:${parts[1]}`,
        kind: "parameter",
        fields: { shader: name, type, name: parts[1], hasDefault: param.includes("=") },
      })
    }
  }

  for (const match of source.matchAll(/closure\s*\(\s*"([^"]+)"/g)) {
    records.push({ id: `closure:${match[1]}`, kind: "closure", fields: { name: match[1] } })
  }

  if (seen.size === 0) {
    issues.push({ code: "no-shader", severity: "error", message: "No shader declaration found" })
  }

  return {
    format: "OSL",
    records,
    meta: {
      shaders: seen.size,
      parameters: records.filter((record) => record.kind === "parameter").length,
      includes: records.filter((record) => record.kind === "include").length,
      closures: records.filter((record) => record.kind === "closure").length,
    },
    issues,
  }
}

const reference = [
  "Open Shading Language shader source",
  "",
  "#include \"stdosl.h\"",
  "shader name(type param = default, ...) { ... }",
  "Types: float, int, color, vector, point, normal, matrix, string, void, closure.",
  "Closures are created with closure(\"diffuse\", args).",
  "Comments: // to end of line, /* ... */ for blocks.",
  "A shader must have a body with balanced braces.",
].join("\n")

export const format: FormatModule = {
  slug: "osl-shader",
  displayName: "OSL",
  extensions: [".osl"],
  description: "Parse OSL shaders, parameters, includes and closures.",
  reference,
  parse,
  sample: () =>
    [
      '#include "stdosl.h"',
      "",
      "shader demo_color(",
      "    color base_color = color(0.8),",
      "    float roughness = 0.2",
      ")",
      "{",
      '    Ci = closure("diffuse", base_color) * (1.0 - roughness);',
      "}",
    ].join("\n") + "\n",
}
