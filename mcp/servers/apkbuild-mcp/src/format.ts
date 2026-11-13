import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

const REQUIRED = ["pkgname", "pkgver", "pkgrel", "pkgdesc", "arch", "license"]

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const variables = new Map<string, string>()
  const functions = new Set<string>()
  let depth = 0
  let openFunction = ""

  if (text.trim().length === 0) issues.push({ code: "empty", severity: "error", message: "Document is empty" })

  text.split(/\r?\n/).forEach((raw, index) => {
    const lineNo = index + 1
    const line = raw.trim()
    if (!line || line.startsWith("#")) return

    if (depth === 0) {
      const func = /^([A-Za-z_][A-Za-z0-9_]*)\(\)\s*\{/.exec(line)
      if (func) {
        if (functions.has(func[1])) issues.push({ code: "duplicate-function", severity: "error", message: `Function ${func[1]} is defined twice`, line: lineNo })
        functions.add(func[1])
        openFunction = func[1]
        depth += (line.match(/\{/g) ?? []).length - (line.match(/\}/g) ?? []).length
        if (depth === 0) openFunction = ""
        records.push({ id: `function:${func[1]}`, kind: "function", fields: { name: func[1], line: lineNo } })
        return
      }
      const variable = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(line)
      if (variable) {
        const name = variable[1]
        const value = variable[2].trim().replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1")
        if (variables.has(name)) issues.push({ code: "duplicate-variable", severity: "error", message: `${name} is assigned twice`, line: lineNo })
        if (!value) issues.push({ code: "empty-variable", severity: "warning", message: `${name} is empty`, line: lineNo })
        variables.set(name, value)
        records.push({ id: `var:${name}`, kind: "variable", fields: { name, value, line: lineNo } })
        return
      }
      issues.push({ code: "bad-line", severity: "warning", message: `Statement outside a function: ${line}`, line: lineNo })
      return
    }

    depth += (line.match(/\{/g) ?? []).length - (line.match(/\}/g) ?? []).length
    if (depth < 0) {
      issues.push({ code: "stray-close", severity: "error", message: "Closing brace without a function", line: lineNo })
      depth = 0
    }
    if (depth === 0) openFunction = ""
  })

  if (depth > 0) issues.push({ code: "unclosed-function", severity: "error", message: `Function ${openFunction || "block"} is never closed` })
  for (const name of REQUIRED) {
    if (!variables.has(name)) issues.push({ code: "missing-variable", severity: "error", message: `Missing required ${name}` })
  }
  const pkgrel = variables.get("pkgrel") ?? ""
  if (pkgrel && !/^\d+$/.test(pkgrel)) issues.push({ code: "bad-pkgrel", severity: "error", message: `pkgrel must be an integer: ${pkgrel}` })
  const pkgname = variables.get("pkgname") ?? ""
  if (pkgname && !/^[a-z0-9][a-z0-9+_.-]*$/.test(pkgname)) issues.push({ code: "bad-pkgname", severity: "error", message: `Invalid pkgname: ${pkgname}` })
  if (!variables.has("source")) issues.push({ code: "no-source", severity: "warning", message: "No source variable" })
  if (functions.size === 0) issues.push({ code: "no-functions", severity: "error", message: "No build or package function" })

  return {
    format: "APKBUILD",
    records,
    meta: {
      pkgname,
      pkgver: variables.get("pkgver") ?? "",
      pkgrel: pkgrel ? Number(pkgrel) : 0,
      variables: variables.size,
      functions: functions.size,
    },
    issues,
  }
}

const reference = [
  "Alpine APKBUILD",
  "",
  "# Maintainer: Demo <demo@example.com>",
  "pkgname=demo",
  "pkgver=1.0.0",
  "pkgrel=1",
  'pkgdesc="Demo package"',
  'arch="all"',
  'license="MIT"',
  'source="https://example.com/demo-$pkgver.tar.gz"',
  "",
  "build() {",
  "  make",
  "}",
  "",
  "package() {",
  '  make DESTDIR="$pkgdir" install',
  "}",
  "",
  "pkgname, pkgver, pkgrel, pkgdesc, arch and license are required.",
  "At least one build() or package() function is required.",
  "Variables are plain shell assignments at the top level.",
].join("\n")

export const format: FormatModule = {
  slug: "apkbuild",
  displayName: "APKBUILD",
  extensions: ["APKBUILD", ".apkbuild"],
  description: "Parse Alpine APKBUILDs, validate required variables, functions and braces.",
  reference,
  parse,
  sample: () =>
    [
      "# Maintainer: Demo <demo@example.com>",
      "pkgname=demo",
      "pkgver=1.0.0",
      "pkgrel=1",
      'pkgdesc="Demo package"',
      'arch="all"',
      'license="MIT"',
      'depends="musl"',
      'makedepends="gcc make"',
      'source="https://example.com/demo-$pkgver.tar.gz"',
      "",
      "build() {",
      "  make",
      "}",
      "",
      "package() {",
      '  make DESTDIR="$pkgdir" install',
      "}",
    ].join("\n") + "\n",
}
