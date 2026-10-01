const BASE = "https://rxnav.nlm.nih.gov/REST"
const UA = "mrfentmen-rxnav-mcp/1.0 (https://github.com/mrfentmen)"
export class RxnavError extends Error {}

async function getText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/xml" },
    signal: AbortSignal.timeout(30000),
  })
  if (!res.ok) throw new RxnavError(`RxNav returned HTTP ${res.status}`)
  return await res.text()
}

function tagAll(xml: string, tag: string): string[] {
  const out: string[] = []
  const re = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, "g")
  let m: RegExpExecArray | null
  while ((m = re.exec(xml)) !== null) out.push(m[1])
  return out
}

function tagOne(xml: string, tag: string): string | null {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`))
  return m ? m[1] : null
}

export async function search(args: { term?: string }): Promise<string> {
  const term = (args.term ?? "").trim()
  if (!term) throw new RxnavError("Provide a drug name")
  const xml = await getText(`${BASE}/approximateTerm?term=${encodeURIComponent(term)}`)
  const names = tagAll(xml, "name")
  const ids = tagAll(xml, "rxnormId")
  const scores = tagAll(xml, "score")
  if (!names.length) return `No drugs found for \"${term}\"`
  const lines = names.map((n, i) => `${i + 1}. ${n} | RxCUI ${ids[i] ?? "n/a"} | score ${scores[i] ?? "n/a"}`)
  return `Drug matches for \"${term}\":\n` + lines.slice(0, 12).join("\n")
}

export async function properties(args: { rxcui?: string }): Promise<string> {
  const rxcui = (args.rxcui ?? "").trim()
  if (!/^\d+$/.test(rxcui)) throw new RxnavError("Provide a numeric RxCUI")
  const xml = await getText(`${BASE}/rxcui/${encodeURIComponent(rxcui)}/properties`)
  const name = tagOne(xml, "name")
  const synonym = tagOne(xml, "synonym")
  const tty = tagOne(xml, "tty")
  const lines = [
    `RxCUI: ${rxcui}`,
    `Name: ${name ?? "n/a"}`,
  ]
  if (synonym) lines.push(`Synonym: ${synonym}`)
  if (tty) lines.push(`Type: ${tty}`)
  return lines.join("\n")
}

// ---- muxB tools:

interface RxConcept {
  rxcui: string | null
  name: string | null
  synonym: string | null
  tty: string | null
}

interface RxConceptGroup {
  tty: string | null
  rows: RxConcept[]
}

function conceptProps(block: string): RxConcept[] {
  const rows: RxConcept[] = []
  const re = /<conceptProperties>([\s\S]*?)<\/conceptProperties>/g
  let m: RegExpExecArray | null
  while ((m = re.exec(block)) !== null) {
    const body = m[1]
    rows.push({
      rxcui: tagOne(body, "rxcui"),
      name: tagOne(body, "name"),
      synonym: tagOne(body, "synonym"),
      tty: tagOne(body, "tty"),
    })
  }
  return rows
}

function conceptGroups(xml: string): RxConceptGroup[] {
  const out: RxConceptGroup[] = []
  const re = /<conceptGroup>([\s\S]*?)<\/conceptGroup>/g
  let m: RegExpExecArray | null
  while ((m = re.exec(xml)) !== null) {
    const body = m[1]
    const rows = conceptProps(body)
    if (rows.length) out.push({ tty: tagOne(body, "tty"), rows })
  }
  return out
}

const rxField = (value: string | null): string => {
  const text = (value ?? "").trim()
  return text === "" ? "not reported" : text
}

export interface DrugProductsArgs {
  name: string
  limit?: number
}

export interface RelatedConceptsArgs {
  rxcui: string
  tty?: string
}

export interface ConceptHistoryArgs {
  rxcui: string
}

export async function conceptHistory(args: ConceptHistoryArgs): Promise<string> {
  const rxcui = (args.rxcui ?? "").trim()
  if (!/^\d+$/.test(rxcui)) throw new RxnavError("Provide a numeric RxCUI")
  const xml = await getText(`${BASE}/rxcui/${encodeURIComponent(rxcui)}/historystatus`)
  const name = tagOne(xml, "name")
  if (!name) return `RxNorm has no status history for RxCUI ${rxcui}.`
  const strength = tagOne(xml, "numeratorValue")
  const strengthUnit = tagOne(xml, "numeratorUnit")
  const denValue = tagOne(xml, "denominatorValue")
  const denUnit = tagOne(xml, "denominatorUnit")
  const base = tagOne(xml, "baseName")
  const ingredients = tagAll(xml, "ingredientName")
  const lines = [
    `RxNorm history for RxCUI ${rxcui}: ${rxField(name)}`,
    `Status: ${rxField(tagOne(xml, "status"))} | current: ${rxField(tagOne(xml, "isCurrent"))} | source: ${rxField(tagOne(xml, "source"))}`,
    `Active from: ${rxField(tagOne(xml, "activeStartDate"))} | active to: ${rxField(tagOne(xml, "activeEndDate"))}`,
    `Release: ${rxField(tagOne(xml, "releaseStartDate"))} to ${rxField(tagOne(xml, "releaseEndDate"))}`,
    `Type: ${rxField(tagOne(xml, "tty"))} | branded: ${rxField(tagOne(xml, "isBranded"))} | multiple ingredient: ${rxField(tagOne(xml, "isMultipleIngredient"))}`,
    `Ingredient: ${rxField(base)}`,
    ingredients.length > 1 ? `Derived ingredients: ${ingredients.join(", ")}` : "",
    strength
      ? `Strength: ${strength}${strengthUnit ? ` ${strengthUnit}` : ""}${denValue ? ` per ${denValue}${denUnit ? ` ${denUnit}` : ""}` : ""}`
      : "Strength: not reported",
  ].filter((l) => l !== "")
  return lines.join("\n")
}
