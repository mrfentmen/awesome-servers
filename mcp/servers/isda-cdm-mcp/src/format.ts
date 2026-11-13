import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

function walk(value: unknown, types: Map<string, number>): void {
  if (Array.isArray(value)) {
    for (const item of value) walk(item, types)
    return
  }
  if (!value || typeof value !== "object") return
  const entries = Object.entries(value)
  const typeEntry = entries.find(([key]) => key === "@type" || key === "type")
  const tag = typeof typeEntry?.[1] === "string" ? typeEntry[1] : ""
  if (tag) types.set(tag, (types.get(tag) ?? 0) + 1)
  for (const [, item] of entries) walk(item, types)
}

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch (error) {
    return {
      format: "CDM",
      records,
      meta: { objects: 0, types: 0 },
      issues: [{ code: "bad-json", severity: "error", message: `Invalid JSON: ${String(error instanceof Error ? error.message : error)}` }],
    }
  }

  const types = new Map<string, number>()
  walk(data, types)
  const objectCount = [...types.values()].reduce((sum, count) => sum + count, 0)
  const rootType = data && typeof data === "object" && !Array.isArray(data)
    ? (() => {
        const entry = Object.entries(data).find(([key]) => key === "@type" || key === "type")
        return typeof entry?.[1] === "string" ? entry[1] : ""
      })()
    : ""

  let index = 0
  for (const [name, count] of [...types.entries()].sort((a, b) => b[1] - a[1])) {
    index += 1
    records.push({ id: `type:${name}`, kind: name, fields: { name, count, line: index } })
  }

  if (objectCount === 0) issues.push({ code: "no-types", severity: "error", message: "JSON has no @type or type fields" })
  if (data === null) issues.push({ code: "null-root", severity: "error", message: "Root JSON value is null" })

  return {
    format: "CDM",
    records,
    meta: { objects: objectCount, types: types.size, rootType },
    issues,
  }
}

const reference = [
  "ISDA Common Domain Model (JSON)",
  "",
  "{",
  '  "@type": "Trade",',
  '  "tradeDate": { "@type": "TradeDate", "day": "2026-11-13" },',
  '  "product": { "@type": "InterestRatePayout" }',
  "}",
  "",
  "Every CDM object carries an @type or type.",
  "The parser counts objects by type.",
  "Invalid JSON is rejected.",
].join("\n")

export const format: FormatModule = {
  slug: "isda-cdm",
  displayName: "CDM",
  extensions: [".json", ".cdm.json"],
  description: "Parse ISDA CDM JSON, validate structure and count typed objects.",
  reference,
  parse,
  sample: () =>
    JSON.stringify(
      {
        "@type": "Trade",
        tradeDate: { "@type": "TradeDate", day: "2026-11-13" },
        product: { "@type": "InterestRatePayout" },
      },
      null,
      2,
    ) + "\n",
}
