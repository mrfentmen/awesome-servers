import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

const INGREDIENT = /^[A-Za-z0-9][A-Za-z0-9 .,'()/+-]*$/

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter((line) => line.length > 0 && !line.startsWith("#"))
  const seen = new Set<string>()
  let lists = 0

  for (const line of lines) {
    lists += 1
    const items = line.split(/[,;]/).map((item) => item.trim()).filter(Boolean)
    if (items.length === 0) {
      issues.push({ code: "empty-list", severity: "error", message: `Ingredient list ${lists} is empty`, line: lists })
      continue
    }
    for (const item of items) {
      const name = item.replace(/\s*\([^)]*%\)\s*$/, "").trim()
      if (!INGREDIENT.test(name)) {
        issues.push({ code: "bad-ingredient", severity: "error", message: `Not a valid INCI name: ${item.slice(0, 40)}`, line: lists })
        continue
      }
      if (seen.has(name.toLowerCase())) {
        issues.push({ code: "duplicate-ingredient", severity: "warning", message: `Ingredient ${name} appears twice`, line: lists })
      }
      seen.add(name.toLowerCase())
      records.push({ id: `ingredient:${name.toLowerCase()}`, kind: "ingredient", fields: { name, list: lists, line: lists } })
    }
  }

  if (records.length === 0) issues.push({ code: "no-ingredients", severity: "error", message: "File has no ingredients" })

  return {
    format: "INCI",
    records,
    meta: { lists, ingredients: seen.size, rows: records.length },
    issues,
  }
}

const reference = [
  "INCI cosmetic ingredient list",
  "",
  "Aqua, Glycerin, Cetearyl Alcohol, Parfum",
  "Aqua, Sodium Laureth Sulfate, Cocamidopropyl Betaine",
  "",
  "One product per line, ingredients separated by commas or semicolons.",
  "Use official INCI names; percentages in brackets are ignored.",
  "# starts a comment.",
].join("\n")

export const format: FormatModule = {
  slug: "inci",
  displayName: "INCI",
  extensions: [".txt"],
  description: "Parse INCI ingredient lists, validate names, duplicates and lists.",
  reference,
  parse,
  sample: () =>
    [
      "Aqua, Glycerin, Cetearyl Alcohol, Parfum",
      "Aqua, Sodium Laureth Sulfate, Cocamidopropyl Betaine",
    ].join("\n") + "\n",
}
