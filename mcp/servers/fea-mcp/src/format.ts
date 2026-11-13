import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const clean = text.replace(/#[^\n]*/g, "")
  let depth = 0
  let line = 1

  for (const char of clean) {
    if (char === "\n") line += 1
    if (char === "{") depth += 1
    if (char === "}") {
      depth -= 1
      if (depth < 0) {
        issues.push({ code: "extra-brace", severity: "error", message: "Closing brace without an opening brace", line })
        depth = 0
      }
    }
  }
  if (depth !== 0) issues.push({ code: "unclosed-brace", severity: "error", message: `${depth} block(s) are never closed` })

  const featureRe = /feature\s+([A-Za-z0-9]{4})\s*\{([\s\S]*?)\}\s*([A-Za-z0-9]{4})\s*;/g
  let match: RegExpExecArray | null
  let features = 0
  while ((match = featureRe.exec(clean)) !== null) {
    features += 1
    const tag = match[1]
    if (match[3] !== tag) issues.push({ code: "feature-tag", severity: "error", message: `feature ${tag} closes as ${match[3]}` })
    records.push({ id: `feature:${tag}:${features}`, kind: "feature", fields: { tag } })
  }

  const lookupRe = /lookup\s+([A-Za-z_][\w.]*)\s*\{/g
  let lookups = 0
  while ((match = lookupRe.exec(clean)) !== null) {
    lookups += 1
    records.push({ id: `lookup:${match[1]}`, kind: "lookup", fields: { name: match[1] } })
  }

  const languageSystems = (clean.match(/languagesystem\s+[A-Za-z0-9]{4}\s+[A-Za-z0-9]{4}\s*;/g) ?? []).length
  if (features === 0) issues.push({ code: "no-features", severity: "error", message: "File has no feature block" })
  if (features > 0 && languageSystems === 0) issues.push({ code: "no-language-system", severity: "warning", message: "No languagesystem statement" })

  return { format: "FEA", records, meta: { features, lookups, languageSystems }, issues }
}

const reference = [
  "OpenType feature file",
  "",
  "languagesystem DFLT dflt;",
  "",
  "feature liga {",
  "  sub f i by fi;",
  "} liga;",
  "",
  "feature kern {",
  "  pos A V -80;",
  "} kern;",
  "",
  "Braces must balance.",
  "A feature opens with feature tag { and closes with } tag; using the same tag.",
  "Statements end with a semicolon.",
].join("\n")

export const format: FormatModule = {
  slug: "fea",
  displayName: "FEA",
  extensions: [".fea"],
  description: "Parse OpenType feature files, validate blocks, tags and braces.",
  reference,
  parse,
  sample: () =>
    [
      "languagesystem DFLT dflt;",
      "",
      "feature liga {",
      "  sub f i by fi;",
      "} liga;",
      "",
      "feature kern {",
      "  pos A V -80;",
      "} kern;",
    ].join("\n") + "\n",
}
