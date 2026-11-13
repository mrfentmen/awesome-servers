import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

function splitRow(line: string): string[] {
  const cells: string[] = []
  let value = ""
  let quoted = false
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        value += '"'
        index += 1
      } else {
        quoted = !quoted
      }
      continue
    }
    if (char === "," && !quoted) {
      cells.push(value.trim())
      value = ""
      continue
    }
    value += char
  }
  cells.push(value.trim())
  return cells
}

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0)
  if (lines.length === 0) {
    return { format: "OMOP CDM", records, meta: { rows: 0 }, issues: [{ code: "empty", severity: "error", message: "File is empty" }] }
  }

  const header = splitRow(lines[0]).map((cell) => cell.toLowerCase())
  const index = (name: string) => header.indexOf(name)
  for (const required of ["concept_id", "concept_name", "domain_id", "vocabulary_id"]) {
    if (index(required) < 0) {
      issues.push({ code: "missing-column", severity: "error", message: `Header has no ${required} column`, line: 1 })
    }
  }
  const idIndex = index("concept_id")
  const standardIndex = index("standard_concept")
  const vocabularies = new Set<string>()
  const domains = new Set<string>()

  lines.slice(1).forEach((line, offset) => {
    const number = offset + 2
    const cells = splitRow(line)
    if (cells.length !== header.length) {
      issues.push({ code: "bad-width", severity: "error", message: `Row has ${cells.length} cells, header has ${header.length}`, line: number })
      return
    }
    const id = Number(cells[idIndex])
    if (!Number.isInteger(id) || id <= 0) {
      issues.push({ code: "bad-concept-id", severity: "error", message: `concept_id must be a positive integer: ${cells[idIndex]}`, line: number })
    }
    const standard = standardIndex >= 0 ? cells[standardIndex] : ""
    if (standard && !["S", "C"].includes(standard)) {
      issues.push({ code: "bad-standard", severity: "error", message: `standard_concept must be S or C: ${standard}`, line: number })
    }
    const vocabulary = cells[index("vocabulary_id")] ?? ""
    const domain = cells[index("domain_id")] ?? ""
    if (vocabulary) vocabularies.add(vocabulary)
    if (domain) domains.add(domain)
    records.push({
      id: `concept:${cells[idIndex] ?? number}`,
      kind: "concept",
      fields: { conceptId: Number.isInteger(id) ? id : 0, name: cells[index("concept_name")] ?? "", domain, vocabulary, standard, line: number },
    })
  })

  return {
    format: "OMOP CDM",
    records,
    meta: { rows: records.length, vocabularies: vocabularies.size, domains: domains.size, standardConcepts: records.filter((record) => record.fields.standard === "S").length },
    issues,
  }
}

const reference = [
  "OMOP CDM concept table export (CSV)",
  "",
  "concept_id,concept_name,domain_id,vocabulary_id,concept_class_id,standard_concept,concept_code",
  "404684003,Clinical finding,Condition,SNOMED,Clinical Finding,S,404684003",
  "3028437,Metformin,Drug,RxNorm,Ingredient,S,860975",
  "",
  "concept_id is a positive integer.",
  "standard_concept is S (standard), C (classification) or empty.",
  "domain_id and vocabulary_id name the source vocabularies.",
].join("\n")

export const format: FormatModule = {
  slug: "omop-cdm",
  displayName: "OMOP CDM",
  extensions: [".csv"],
  description: "Parse OMOP concept exports, validate concept ids, domains and vocabularies.",
  reference,
  parse,
  sample: () =>
    [
      "concept_id,concept_name,domain_id,vocabulary_id,concept_class_id,standard_concept,concept_code",
      "404684003,Clinical finding,Condition,SNOMED,Clinical Finding,S,404684003",
      "3028437,Metformin,Drug,RxNorm,Ingredient,S,860975",
    ].join("\n") + "\n",
}
