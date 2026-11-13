import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

const PRIMITIVES = new Set([
  "polygon", "sphere", "bubble", "cube", "cylinder", "cone", "cup", "ring", "torus",
  "source", "illum", "glow", "spotlight", "mirror", "prism", "instance", "mesh", "tube",
])

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/#.*$/, "").trim())
    .filter((line) => line.length > 0)

  let index = 0
  let primitives = 0
  const modifiers = new Set<string>()
  const used = new Set<string>()

  while (index < lines.length) {
    const number = index + 1
    const header = lines[index].split(/\s+/)
    index += 1
    if (header.length < 3) {
      issues.push({ code: "bad-header", severity: "error", message: `Primitive header needs modifier, type and name: ${header.join(" ").slice(0, 50)}`, line: number })
      continue
    }

    const [modifier, type, name] = header
    if (modifier !== "void") used.add(modifier)
    modifiers.add(name)

    // Radiance puts three counts after the header, then the arguments. Both may
    // run across several lines, so read tokens rather than lines.
    let buffer: string[] = []
    const nextToken = (): string | null => {
      while (buffer.length === 0) {
        if (index >= lines.length) return null
        buffer = lines[index].split(/\s+/)
        index += 1
      }
      return buffer.shift() ?? null
    }

    const counts: number[] = []
    for (let position = 0; position < 3; position += 1) {
      const token = nextToken()
      if (token === null) break
      const value = Number(token)
      if (!Number.isInteger(value) || value < 0) {
        issues.push({ code: "bad-counts", severity: "error", message: `${name}: count ${position + 1} is not a non negative integer: ${token}`, line: number })
        break
      }
      counts.push(value)
    }
    if (counts.length !== 3) {
      issues.push({ code: "bad-counts", severity: "error", message: `${name} is missing its three counts (strings reals integers)`, line: number })
      continue
    }

    const [strings, reals, integers] = counts
    const total = strings + reals + integers
    let argumentsRead = 0
    for (let position = 0; position < total; position += 1) {
      if (nextToken() === null) break
      argumentsRead += 1
    }
    if (argumentsRead < total) {
      issues.push({
        code: "short-arguments",
        severity: "error",
        message: `${name} declares ${total} argument(s) but only ${argumentsRead} were found`,
        line: number,
      })
    }
    if (type !== "void" && !PRIMITIVES.has(type)) {
      issues.push({ code: "unknown-primitive", severity: "warning", message: `Unknown primitive type: ${type}`, line: number })
    }
    if (type === "polygon" && reals > 0 && reals % 3 !== 0) {
      issues.push({ code: "bad-polygon", severity: "error", message: `Polygon ${name} has ${reals} coordinates, which is not a multiple of 3`, line: number })
    }

    primitives += 1
    records.push({
      id: `${type}:${name}`,
      kind: type === "void" ? "material" : type,
      fields: { modifier, type, name, strings, reals, integers, arguments: argumentsRead, line: number },
    })
  }

  for (const record of records) {
    const modifier = String(record.fields.modifier ?? "")
    if (modifier !== "void" && !modifiers.has(modifier)) {
      issues.push({ code: "dangling-modifier", severity: "warning", message: `${record.fields.name} uses modifier ${modifier}, which is not defined` })
    }
  }
  if (primitives === 0) {
    issues.push({ code: "no-primitives", severity: "error", message: "Scene contains no primitives" })
  }

  return {
    format: "Radiance",
    records,
    meta: {
      primitives,
      materials: records.filter((record) => record.kind === "material").length,
      surfaces: records.filter((record) => record.kind !== "material").length,
      modifiers: modifiers.size,
      usedModifiers: used.size,
    },
    issues,
  }
}

const reference = [
  "Radiance scene description (.rad)",
  "",
  "void plastic wall_mat",
  "0",
  "0",
  "5 0.5 0.5 0.5 0 0",
  "",
  "wall_mat polygon wall",
  "0",
  "0",
  "12 0 0 0 10 0 0 10 10 0 0 10 0",
  "",
  "First line: modifier, primitive type, instance name.",
  "Then three counts: strings, reals, integers. They may span lines.",
  "Then the arguments in that order; they may also span lines.",
  "void defines a new modifier; any other name reuses one.",
  "Polygon coordinates must be a multiple of 3.",
].join("\n")

export const format: FormatModule = {
  slug: "radiance",
  displayName: "Radiance",
  extensions: [".rad"],
  description: "Parse Radiance scenes, validate primitive counts and polygon geometry.",
  reference,
  parse,
  sample: () =>
    [
      "void plastic wall_mat",
      "0",
      "0",
      "5 0.5 0.5 0.5 0 0",
      "",
      "wall_mat polygon wall",
      "0",
      "0",
      "12 0 0 0 10 0 0 10 10 0 0 10 0",
    ].join("\n") + "\n",
}
