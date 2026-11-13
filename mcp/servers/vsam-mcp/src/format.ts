import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []

  const statements: string[] = []
  let buffer = ""
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (line.length === 0 || line.startsWith("//")) continue
    const continues = line.endsWith("-")
    buffer += (buffer ? " " : "") + line.replace(/-\s*$/, "").trim()
    if (!continues && buffer.length > 0) {
      statements.push(buffer)
      buffer = ""
    }
  }
  if (buffer.length > 0) statements.push(buffer)

  const opens = (text.match(/\(/g) ?? []).length
  const closes = (text.match(/\)/g) ?? []).length
  if (opens !== closes) {
    issues.push({ code: "unbalanced-parens", severity: "error", message: `Parentheses are unbalanced: ${opens} open, ${closes} close` })
  }

  for (const [index, statement] of statements.entries()) {
    const number = index + 1
    const define = /^DEFINE\s+(CLUSTER|PATH|ALTER|AIX|NONVSAM|ENTRY|RECORD)\s*\((.*)\)\s*$/i.exec(statement)
    if (!define) {
      issues.push({ code: "unknown-statement", severity: "warning", message: `Not a DEFINE statement: ${statement.slice(0, 40)}`, line: number })
      continue
    }
    const kind = define[1].toUpperCase()
    const body = define[2]
    const params: Record<string, string> = {}
    for (const pair of body.matchAll(/([A-Za-z]+)\s*\(([^)]*)\)/g)) params[pair[1].toUpperCase()] = pair[2].trim()

    if (kind === "CLUSTER") {
      if (!params.NAME) {
        issues.push({ code: "cluster-without-name", severity: "error", message: "DEFINE CLUSTER needs NAME(...)", line: number })
      }
      if (params.KEYS) {
        const keys = params.KEYS.split(/\s+/).map(Number)
        if (keys.length < 1 || !Number.isInteger(keys[0]) || keys[0] <= 0) {
          issues.push({ code: "bad-keys", severity: "error", message: `KEYS must give a key length: ${params.KEYS}`, line: number })
        }
      }
      if (params.RECORDSIZE) {
        const sizes = params.RECORDSIZE.split(/\s+/).map(Number)
        if (sizes.some((size) => !Number.isInteger(size) || size <= 0)) {
          issues.push({ code: "bad-recordsize", severity: "error", message: `RECORDSIZE must be positive: ${params.RECORDSIZE}`, line: number })
        }
      }
    }

    records.push({ id: `${kind}:${params.NAME ?? number}`, kind: kind.toLowerCase(), fields: { name: params.NAME ?? "", keys: params.KEYS ?? "", recordsize: params.RECORDSIZE ?? "", line: number } })
  }

  if (records.length === 0) {
    issues.push({ code: "no-definitions", severity: "error", message: "Input has no DEFINE statement" })
  }

  return {
    format: "VSAM",
    records,
    meta: {
      definitions: records.length,
      clusters: records.filter((record) => record.kind === "cluster").length,
      paths: records.filter((record) => record.kind === "path").length,
    },
    issues,
  }
}

const reference = [
  "VSAM cluster definition (IDCAMS)",
  "",
  "  DEFINE CLUSTER (NAME(APP.DATA) -",
  "                  INDEXED -",
  "                  KEYS(20 0) -",
  "                  RECORDSIZE(100 100) -",
  "                  CYLINDERS(1 1))",
  "",
  "DEFINE takes a type in brackets: CLUSTER, PATH, AIX, ALTERNATE INDEX.",
  "A trailing hyphen continues the statement on the next line.",
  "CLUSTER needs NAME; KEYS and RECORDSIZE must be positive numbers.",
  "// starts a JCL comment.",
].join("\n")

export const format: FormatModule = {
  slug: "vsam",
  displayName: "VSAM",
  extensions: [".idcams", ".vsam"],
  description: "Parse VSAM IDCAMS definitions, validate clusters, keys and record sizes.",
  reference,
  parse,
  sample: () =>
    [
      "  DEFINE CLUSTER (NAME(APP.DATA) -",
      "                  INDEXED -",
      "                  KEYS(20 0) -",
      "                  RECORDSIZE(100 100) -",
      "                  CYLINDERS(1 1))",
    ].join("\n") + "\n",
}
