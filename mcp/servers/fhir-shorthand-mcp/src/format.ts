import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

const ENTITIES = new Set(["profile", "extension", "logical", "resource", "valueset", "codesystem", "instances", "invariant", "ruleSet", "mapping"])

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const ids = new Set<string>()
  let entities = 0
  let rules = 0
  let parent = ""

  text.split(/\r?\n/).forEach((raw, index) => {
    const number = index + 1
    const line = raw.replace(/\/\/.*$/, "").trimEnd()
    if (line.trim().length === 0) return

    const entity = /^([A-Za-z]+):\s*(.*)$/.exec(line)
    if (entity) {
      const kind = entity[1].toLowerCase()
      if (!ENTITIES.has(kind)) return
      entities += 1
      const name = entity[2].replace(/^"|"$/g, "").trim()
      if (!name) {
        issues.push({ code: "empty-entity", severity: "error", message: `${entity[1]} has no name`, line: number })
      }
      records.push({ id: `${kind}:${name || number}`, kind, fields: { name, line: number } })
      return
    }

    const rule = /^\*+\s*(.*)$/.exec(line)
    if (rule) {
      rules += 1
      const body = rule[1].trim()
      if (!body) {
        issues.push({ code: "empty-rule", severity: "error", message: "Rule has no body", line: number })
        return
      }
      if (entities === 0) {
        issues.push({ code: "rule-before-entity", severity: "error", message: "Rule appears before any Profile or Resource", line: number })
      }
      records.push({ id: `rule:${number}`, kind: "rule", fields: { body: body.slice(0, 120), line: number } })
      return
    }

    const key = /^([A-Za-z]+):\s*(.*)$/.exec(line)
    if (key) {
      const name = key[1].toLowerCase()
      const value = key[2].replace(/^"|"$/g, "").trim()
      if (name === "parent") parent = value
      if (name === "id") {
        if (ids.has(value)) {
          issues.push({ code: "duplicate-id", severity: "error", message: `Id ${value} is used twice`, line: number })
        }
        ids.add(value)
      }
      records.push({ id: `meta:${name}:${number}`, kind: "metadata", fields: { name, value, line: number } })
      return
    }

    issues.push({ code: "unknown-line", severity: "warning", message: `Not a FSH statement: ${line.slice(0, 40)}`, line: number })
  })

  if (entities === 0) {
    issues.push({ code: "no-entity", severity: "error", message: "File defines no Profile, Extension, Logical or Resource" })
  }
  if (entities > 0 && !parent) {
    issues.push({ code: "no-parent", severity: "warning", message: "Definition has no Parent" })
  }
  if (rules === 0) {
    issues.push({ code: "no-rules", severity: "warning", message: "Definition has no element rules" })
  }

  return {
    format: "FHIR Shorthand",
    records,
    meta: { entities, rules, parent, ids: ids.size },
    issues,
  }
}

const reference = [
  "FHIR Shorthand (FSH)",
  "",
  "Profile: DemoPatient",
  "Parent: Patient",
  "Id: demo-patient",
  "Title: \"Demo Patient\"",
  "* name 1..1",
  "* identifier 0..*",
  "",
  "Each definition starts with Profile:, Extension:, Logical: or Resource:.",
  "Parent names the base resource; Id is the profile id.",
  "Element rules start with * and use FHIRPath.",
].join("\n")

export const format: FormatModule = {
  slug: "fhir-shorthand",
  displayName: "FHIR Shorthand",
  extensions: [".fsh"],
  description: "Parse FSH definitions, validate entities, parents, ids and element rules.",
  reference,
  parse,
  sample: () =>
    [
      "Profile: DemoPatient",
      "Parent: Patient",
      "Id: demo-patient",
      'Title: "Demo Patient"',
      "* name 1..1",
      "* identifier 0..*",
    ].join("\n") + "\n",
}
