import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

function stripComments(text: string): string {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split(/\r?\n/)
    .map((line) => line.replace(/\/\/.*$/, ""))
    .join("\n")
}

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const source = stripComments(text)

  if (source.trim().length === 0) {
    issues.push({ code: "empty", severity: "error", message: "Document is empty" })
    return { format: "SOME/IP IDL", records, meta: { interfaces: 0 }, issues }
  }

  const openBraces = (source.match(/\{/g) ?? []).length
  const closeBraces = (source.match(/\}/g) ?? []).length
  if (openBraces !== closeBraces) {
    issues.push({
      code: "unbalanced-braces",
      severity: "error",
      message: `Unbalanced braces: ${openBraces} open, ${closeBraces} close`,
    })
  }

  let packageName = ""
  let currentInterface = ""
  let currentBlock = ""
  let interfaceDepth = 0
  let blockDepth = 0
  let depth = 0
  let interfaces = 0
  let methods = 0
  let events = 0
  let fields = 0
  let structs = 0
  let enums = 0
  let members = 0

  const versions = new Map<string, string>()
  const activity = new Map<string, number>()
  const names = new Map<string, Set<string>>()
  const seenInterfaces = new Set<string>()

  const bump = (name: string): void => {
    if (currentInterface) activity.set(currentInterface, (activity.get(currentInterface) ?? 0) + 1)
    if (!currentInterface) return
    const set = names.get(currentInterface) ?? new Set<string>()
    if (set.has(name)) {
      issues.push({ code: "duplicate-name", severity: "error", message: `Duplicate member ${name} in ${currentInterface}` })
    }
    set.add(name)
    names.set(currentInterface, set)
  }

  const lines = source.split(/\r?\n/)
  lines.forEach((raw, index) => {
    const line = raw.trim()
    if (!line) return

    let match = /^package\s+([A-Za-z_][\w.]*)\s*;/.exec(line)
    if (match) {
      if (packageName) issues.push({ code: "duplicate-package", severity: "warning", message: "More than one package declaration" })
      packageName = match[1]
      records.push({ id: `package:${packageName}`, kind: "package", fields: { name: packageName, line: index + 1 } })
      return
    }

    match = /^(interface|service)\s+([A-Za-z_]\w*)\s*\{/.exec(line)
    if (match) {
      if (seenInterfaces.has(match[2])) {
        issues.push({ code: "duplicate-interface", severity: "error", message: `Interface ${match[2]} is defined twice` })
      }
      seenInterfaces.add(match[2])
      currentInterface = match[2]
      currentBlock = ""
      depth += 1
      interfaceDepth = depth
      interfaces += 1
      records.push({
        id: `interface:${match[2]}`,
        kind: "interface",
        fields: { name: match[2], type: match[1], line: index + 1 },
      })
      return
    }

    match = /^version\s+([0-9]+(?:\.[0-9]+)*)\s*;/.exec(line)
    if (match) {
      if (!currentInterface) {
        issues.push({ code: "version-outside-interface", severity: "warning", message: "Version outside an interface", line: index + 1 })
      } else {
        versions.set(currentInterface, match[1])
      }
      records.push({
        id: `version:${currentInterface || "global"}:${match[1]}`,
        kind: "version",
        fields: { interface: currentInterface || "global", version: match[1], line: index + 1 },
      })
      return
    }

    match = /^(method|event|field|attribute)\s+([A-Za-z_]\w*)\s*(\{|;)/.exec(line)
    if (match) {
      const kind = match[1]
      const name = match[2]
      if (!currentInterface) {
        issues.push({ code: "member-outside-interface", severity: "error", message: `${kind} ${name} is outside an interface`, line: index + 1 })
      }
      bump(name)
      if (kind === "method") methods += 1
      else if (kind === "event") events += 1
      else if (kind === "field") fields += 1
      records.push({
        id: `${kind}:${name}`,
        kind,
        fields: { name, interface: currentInterface || "", line: index + 1 },
      })
      if (match[3] === "{") {
        currentBlock = name
        depth += 1
        blockDepth = depth
      } else {
        currentBlock = ""
        blockDepth = 0
      }
      return
    }

    match = /^(struct|enum)\s+([A-Za-z_]\w*)\s*\{/.exec(line)
    if (match) {
      const kind = match[1]
      const name = match[2]
      if (!currentInterface) {
        issues.push({ code: "type-outside-interface", severity: "warning", message: `${kind} ${name} is outside an interface`, line: index + 1 })
      }
      bump(name)
      if (kind === "struct") structs += 1
      else enums += 1
      records.push({
        id: `${kind}:${name}`,
        kind,
        fields: { name, interface: currentInterface || "", line: index + 1 },
      })
      currentBlock = name
      depth += 1
      blockDepth = depth
      return
    }

    if (/^(in|out)\s*\{/.test(line)) {
      depth += 1
      return
    }

    if (line === "}" || line === "};") {
      depth -= 1
      if (currentBlock && depth < blockDepth) {
        currentBlock = ""
        blockDepth = 0
      }
      if (currentInterface && depth < interfaceDepth) {
        currentInterface = ""
        interfaceDepth = 0
      }
      return
    }

    match = /^([A-Za-z_]\w*(?:<[^>]+>)?)\s+([A-Za-z_]\w*)\s*;/.exec(line)
    if (match) {
      members += 1
      if (currentInterface) activity.set(currentInterface, (activity.get(currentInterface) ?? 0) + 1)
      records.push({
        id: `member:${members}`,
        kind: "member",
        fields: {
          type: match[1],
          name: match[2],
          container: currentBlock || currentInterface || "",
          line: index + 1,
        },
      })
      return
    }

    if (/^(method|event|field)\s*\{/.test(line)) {
      issues.push({ code: "missing-member-name", severity: "error", message: `${line.split(/\s+/)[0]} needs a name`, line: index + 1 })
    }
  })

  if (interfaces === 0) issues.push({ code: "no-interfaces", severity: "error", message: "No interface or service found" })
  if (!packageName) issues.push({ code: "no-package", severity: "warning", message: "No package declaration" })
  if (depth !== 0) issues.push({ code: "bad-depth", severity: "error", message: `Brace depth ends at ${depth}, expected 0` })

  for (const name of seenInterfaces) {
    if (!versions.has(name)) issues.push({ code: "no-version", severity: "warning", message: `Interface ${name} has no version` })
    if ((activity.get(name) ?? 0) === 0) issues.push({ code: "empty-interface", severity: "error", message: `Interface ${name} has no members` })
  }

  return {
    format: "SOME/IP IDL",
    records,
    meta: {
      package: packageName,
      interfaces,
      methods,
      events,
      fields,
      structs,
      enums,
      members,
      versions: versions.size,
    },
    issues,
  }
}

const reference = [
  "SOME/IP IDL",
  "",
  "package demo;",
  "interface DemoService {",
  "  version 1.0;",
  "  method Add {",
  "    in { uint32 a; uint32 b; }",
  "    out { uint32 result; }",
  "  }",
  "  event Status { uint32 code; }",
  "  field Speed { uint32 value; }",
  "}",
  "",
  "The package declares the namespace.",
  "Each interface or service declares a version.",
  "Methods, events and fields have unique names inside one interface.",
  "Braces must balance; members are type name pairs.",
].join("\n")

export const format: FormatModule = {
  slug: "someip",
  displayName: "SOME/IP IDL",
  extensions: [".idl", ".someip"],
  description: "Parse SOME/IP IDL, validate packages, interfaces, methods, events, fields and versions.",
  reference,
  parse,
  regressions: [
    {
      doc: "interface Broken {\n  method Add {\n}",
      expectError: "Unbalanced braces",
    },
    {
      doc: "interface Empty {\n  version 1.0;\n}\n",
      expectError: "has no members",
    },
  ],
  sample: () =>
    [
      "package demo;",
      "",
      "interface DemoService {",
      "  version 1.0;",
      "",
      "  method Add {",
      "    in {",
      "      uint32 a;",
      "      uint32 b;",
      "    }",
      "    out {",
      "      uint32 result;",
      "    }",
      "  }",
      "",
      "  event Status {",
      "    uint32 code;",
      "  }",
      "",
      "  field Speed {",
      "    uint32 value;",
      "  }",
      "}",
    ].join("\n") + "\n",
}
