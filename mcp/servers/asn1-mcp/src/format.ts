import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

const BUILTIN = new Set([
  "INTEGER", "BOOLEAN", "OCTET", "BIT", "STRING", "NULL", "OBJECT", "IDENTIFIER",
  "SEQUENCE", "SET", "CHOICE", "ENUMERATED", "REAL", "UTCTime", "GeneralizedTime",
  "PrintableString", "UTF8String", "IA5String", "NumericString", "VisibleString",
  "ANY", "RELATIVE-OID", "OID", "SIZE", "OF", "OPTIONAL", "DEFAULT", "IMPLICIT", "EXPLICIT",
])

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const source = text.replace(/--[^\n]*/g, "")
  const types = new Map<string, number>()

  const module = /^([A-Za-z][\w-]*)\s+DEFINITIONS\b/.exec(source.trim())
  if (!module) {
    issues.push({ code: "no-module", severity: "error", message: "File must start with ModuleName DEFINITIONS" })
  }
  if (!/\bBEGIN\b/.test(source)) issues.push({ code: "no-begin", severity: "error", message: "Module has no BEGIN" })
  if (!/\bEND\b/.test(source)) issues.push({ code: "no-end", severity: "error", message: "Module has no END" })

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

  for (const match of source.matchAll(/IMPORTS\s+([\s\S]*?);/g)) {
    const body = match[1].replace(/\s+/g, " ").trim()
    records.push({ id: `imports:${records.length + 1}`, kind: "imports", fields: { body: body.slice(0, 200) } })
  }

  for (const match of source.matchAll(/^\s*([A-Z][\w-]*)\s*::=\s*([\s\S]*?)(?=\n\s*[A-Z][\w-]*\s*::=|\n\s*END\b|$)/gm)) {
    const name = match[1]
    const body = match[2].trim()
    if (!body) continue
    if (types.has(name)) {
      issues.push({ code: "duplicate-type", severity: "error", message: `Type ${name} is assigned twice` })
    }
    types.set(name, 1)
    const kind = /^SEQUENCE|^SET|^CHOICE/.exec(body)
    if (/^SEQUENCE\s*\{\s*\}/.test(body) || /^SET\s*\{\s*\}/.test(body)) {
      issues.push({ code: "empty-constructor", severity: "error", message: `${name} is an empty ${kind ? kind[0] : "constructor"}` })
    }
    const refs = [...body.matchAll(/\b([A-Z][A-Za-z0-9-]+)\b/g)]
      .map((ref) => ref[1])
      .filter((ref) => !BUILTIN.has(ref) && ref !== name)
    records.push({
      id: `type:${name}`,
      kind: "type",
      fields: { name, constructor: kind ? kind[0] : "alias", references: refs.join(","), members: (body.match(/,/g) ?? []).length + 1 },
    })
  }

  if (records.filter((record) => record.kind === "type").length === 0) {
    issues.push({ code: "no-types", severity: "warning", message: "Module defines no types" })
  }

  return {
    format: "ASN.1",
    records,
    meta: {
      module: module?.[1] ?? "",
      types: records.filter((record) => record.kind === "type").length,
      imports: records.filter((record) => record.kind === "imports").length,
    },
    issues,
  }
}

const reference = [
  "ASN.1 module",
  "",
  "ModuleName DEFINITIONS ::= BEGIN",
  "  IMPORTS OtherType FROM OtherModule;",
  "  Message ::= SEQUENCE {",
  "      id INTEGER (0..65535),",
  "      name OCTET STRING OPTIONAL",
  "  }",
  "END",
  "",
  "Type assignments use ::= and start with an upper case letter.",
  "SEQUENCE and SET bodies use braces; CHOICE picks one alternative.",
  "Comments start with -- and run to end of line.",
].join("\n")

export const format: FormatModule = {
  slug: "asn1",
  displayName: "ASN.1",
  extensions: [".asn", ".asn1"],
  description: "Parse ASN.1 modules, list type assignments and validate structure.",
  reference,
  parse,
  sample: () =>
    [
      "DemoModule DEFINITIONS ::= BEGIN",
      "  IMPORTS OtherType FROM OtherModule;",
      "  Message ::= SEQUENCE {",
      "      id INTEGER (0..65535),",
      "      name OCTET STRING OPTIONAL",
      "  }",
      "END",
    ].join("\n") + "\n",
}
