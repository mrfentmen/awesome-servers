import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

const RECORD_TYPES = new Set(["SOC", "HLGT", "HLT", "PT", "LLT", "SMQ"])

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0)
  const types = new Map<string, number>()

  lines.forEach((raw, index) => {
    const number = index + 1
    const cells = raw.split("$")
    const kind = cells[0].trim().toUpperCase()
    if (!RECORD_TYPES.has(kind)) {
      issues.push({ code: "bad-record-type", severity: "error", message: `Unknown MedDRA record type: ${kind || "(empty)"}`, line: number })
      return
    }
    if (cells.length < 4) {
      issues.push({ code: "short-row", severity: "error", message: `${kind} row needs code, name and parents: ${cells.length} field(s)`, line: number })
      return
    }
    const code = cells[1]
    if (!/^\d{8}$/.test(code)) {
      issues.push({ code: "bad-code", severity: "error", message: `MedDRA code must be 8 digits: ${code}`, line: number })
      return
    }
    if (!cells[2] || cells[2].trim().length === 0) {
      issues.push({ code: "missing-term", severity: "error", message: `${kind} ${code} has no term`, line: number })
    }
    types.set(kind, (types.get(kind) ?? 0) + 1)
    records.push({ id: `${kind}:${code}`, kind: kind.toLowerCase(), fields: { code, term: cells[2].trim(), parents: cells.slice(3).join("$").slice(0, 80), line: number } })
  })

  if (records.length === 0) {
    issues.push({ code: "no-records", severity: "error", message: "File has no MedDRA records" })
  }

  return {
    format: "MedDRA",
    records,
    meta: {
      records: records.length,
      soc: types.get("SOC") ?? 0,
      pT: types.get("PT") ?? 0,
      llt: types.get("LLT") ?? 0,
      kinds: types.size,
    },
    issues,
  }
}

const reference = [
  "MedDRA ASCII release file ($ separated)",
  "",
  "LLT$10000001$Headache$10019211$10019211$1$N$N$",
  "PT$10019211$Headache$10000001$",
  "SOC$10000000$Investigations$",
  "",
  "Field 0 is the record type: SOC, HLGT, HLT, PT or LLT.",
  "Field 1 is the 8 digit MedDRA code.",
  "Field 2 is the term; later fields are parent codes and flags.",
].join("\n")

export const format: FormatModule = {
  slug: "meddra",
  displayName: "MedDRA",
  extensions: [".asc"],
  description: "Parse MedDRA ASCII files, validate record types, codes and terms.",
  reference,
  parse,
  sample: () =>
    [
      "LLT$10000001$Headache$10019211$10019211$1$N$N$",
      "PT$10019211$Headache$10000001$",
      "SOC$10000000$Investigations$",
    ].join("\n") + "\n",
}
