/**
 * Chempirical client. Free, keyless, read-only JSON API over 48,000
 * compounds, reactions, Antoine constants and binary azeotropes.
 *
 * Every path below is taken from the live documentation at
 * https://chempirical.com/api/ — no guessing.
 */
const BASE = "https://chempirical.com"

export class ChempiricalError extends Error {}

function asObj(v: unknown): Record<string, unknown> {
  return typeof v === "object" && v !== null ? (v as Record<string, unknown>) : {}
}

function asArr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : []
}

function str(v: unknown): string | undefined {
  return typeof v === "string" && v.length > 0 ? v : undefined
}

function num(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined
}

async function request(path: string, init?: RequestInit): Promise<unknown> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      accept: "application/json",
      "user-agent": "chempirical-mcp/1.0",
      ...(init?.headers ?? {}),
    },
    signal: AbortSignal.timeout(25000),
  })
  if (!res.ok) throw new ChempiricalError(`Chempirical error ${res.status} for ${path}`)
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    throw new ChempiricalError(`Chempirical returned non-JSON for ${path}`)
  }
}

// ---------------------------------------------------------------- types

export interface MoleculeSummary {
  cas?: string
  name?: string
  molarMass?: number
  formula?: string
  similarity?: number
}

export interface SearchResult {
  results: MoleculeSummary[]
  total?: number
  capped?: boolean
}

export interface Molecule {
  cas?: string
  name?: string
  formula?: string
  smiles?: string
  inchi?: string
  inchiKey?: string
  molarMass?: number
  exactMass?: number
  density?: string
  meltingPoint?: string
  boilingPoint?: string
  imageUrl?: string
}

export interface IdentifyResult {
  name?: string
  cas?: string
  sameStereo?: boolean
  structureKey?: string
}

export interface ResolvedCompound {
  term?: string
  name?: string
  cas?: string
  formula?: string
  molarMass?: number
  signalWord?: string
  hazards?: string[]
}

export interface AntoineRow {
  cas?: string
  name?: string
  smiles?: string
  a?: number
  b?: number
  c?: number
  minTemp?: number
  maxTemp?: number
}

export interface AzeotropeRow {
  components?: string[]
  type?: string
  temperatureC?: number
  pressure?: string
}

export interface ReactionSummary {
  slug?: string
  name?: string
  type?: string
  source?: string
}

export interface ReactionParticipant {
  name?: string
  role?: string
  equivalents?: number | null
  massG?: number
}

// ---------------------------------------------------------------- helpers

function parseSummary(v: unknown): MoleculeSummary {
  const o = asObj(v)
  return {
    cas: str(o.cas),
    name: str(o.name),
    molarMass: num(o.molarMass),
    formula: str(o.formula),
    similarity: num(o.similarity),
  }
}

function parseSearch(payload: unknown): SearchResult {
  const o = asObj(payload)
  return {
    results: asArr(o.results).map(parseSummary),
    total: num(o.total),
    capped: typeof o.capped === "boolean" ? o.capped : undefined,
  }
}

function textOf(v: unknown): string | undefined {
  return str(asObj(v).text)
}

function parseMolecule(payload: unknown): Molecule {
  const o = asObj(payload)
  const props = asObj(o.properties)
  const physical = asObj(o.physical)
  const ident = asObj(o.identifiers)
  return {
    cas: str(o.cas),
    name: str(o.name),
    formula: str(o.formula),
    smiles: str(o.smiles) ?? str(ident.smiles),
    inchi: str(o.inchi) ?? str(ident.inchi),
    inchiKey: str(o.inchikey) ?? str(o.inchiKey) ?? str(ident.inchikey),
    molarMass: num(o.molar_mass_g_per_mol) ?? num(props.molar_mass_g_per_mol) ?? num(o.molarMass),
    exactMass: num(o.exact_mass_g_per_mol) ?? num(props.exact_mass_g_per_mol) ?? num(o.exactMass),
    density: textOf(physical.density) ?? str(o.density),
    meltingPoint: textOf(physical.meltingPoint) ?? str(o.meltingPoint),
    boilingPoint: textOf(physical.boilingPoint) ?? str(o.boilingPoint),
    imageUrl: str(o.imageUrl) ?? str(o.structureImageUrl),
  }
}

// ---------------------------------------------------------------- calls

export async function searchMolecules(q: string, limit = 20, offset = 0): Promise<SearchResult> {
  const p = `/api/molecules?q=${encodeURIComponent(q)}&limit=${limit}&offset=${offset}`
  return parseSearch(await request(p))
}

export async function getMolecule(cas: string): Promise<Molecule> {
  return parseMolecule(await request(`/api/molecules/${encodeURIComponent(cas)}`))
}

export async function substructureSearch(substructure: string, limit = 20, offset = 0): Promise<SearchResult> {
  const p = `/api/molecules?substructure=${encodeURIComponent(substructure)}&limit=${limit}&offset=${offset}`
  return parseSearch(await request(p))
}

export async function similaritySearch(smiles: string, limit = 20, offset = 0): Promise<SearchResult> {
  const p = `/api/molecules?similar=${encodeURIComponent(smiles)}&limit=${limit}&offset=${offset}`
  return parseSearch(await request(p))
}

export async function identifyStructure(smiles: string): Promise<IdentifyResult> {
  const o = asObj(await request(`/api/molecules/identify?smiles=${encodeURIComponent(smiles)}`))
  const match = asObj(o.match)
  return {
    name: str(match.name),
    cas: str(match.cas),
    sameStereo: typeof o.sameStereo === "boolean" ? o.sameStereo : undefined,
    structureKey: str(o.structureKey),
  }
}

export async function resolveTerms(terms: string[]): Promise<ResolvedCompound[]> {
  const payload = await request("/api/molecules/resolve", {
    method: "POST",
    headers: { "content-type": "application/json", origin: BASE },
    body: JSON.stringify({ terms }),
  })
  const rows = asArr(asObj(payload).results)
  return rows.map((row) => {
    const r = asObj(row)
    const c = asObj(r.compound)
    const ghs = asObj(c.ghs)
    const hazards = asArr(ghs.hStatements)
      .map((h) => {
        const o = asObj(h)
        const code = str(o.code)
        const text = str(o.text)
        return code && text ? `${code} ${text}` : code ?? text
      })
      .filter((x): x is string => typeof x === "string")
    return {
      term: str(r.term),
      name: str(c.name),
      cas: str(c.cas),
      formula: str(c.formula),
      molarMass: num(c.molarMass) ?? num(c.molar_mass_g_per_mol),
      signalWord: str(ghs.signalWord),
      hazards,
    }
  })
}

export async function suggestMolecules(q: string): Promise<MoleculeSummary[]> {
  const payload = await request(`/api/molecules/suggest?q=${encodeURIComponent(q)}`)
  return asArr(asObj(payload).results).map(parseSummary)
}

export async function getStructureSvg(cas: string, theme?: "light" | "dark"): Promise<string> {
  const suffix = theme === "dark" ? "?theme=dark" : ""
  const res = await fetch(`${BASE}/api/molecule-svg/${encodeURIComponent(cas)}${suffix}`, {
    headers: { "user-agent": "chempirical-mcp/1.0" },
    signal: AbortSignal.timeout(25000),
  })
  if (!res.ok) throw new ChempiricalError(`Chempirical error ${res.status} for structure ${cas}`)
  return res.text()
}

export async function listReactions(
  opts: { q?: string; reactionType?: string; source?: string; calcReady?: boolean; limit?: number; offset?: number } = {}
): Promise<ReactionSummary[]> {
  const params = new URLSearchParams()
  if (opts.q) params.set("q", opts.q)
  if (opts.reactionType) params.set("reaction_type", opts.reactionType)
  if (opts.source) params.set("source", opts.source)
  if (opts.calcReady) params.set("calc_ready", "1")
  params.set("limit", String(opts.limit ?? 20))
  params.set("offset", String(opts.offset ?? 0))
  const payload = await request(`/api/reactions?${params.toString()}`)
  return asArr(asObj(payload).results).map((row) => {
    const o = asObj(row)
    return { slug: str(o.slug), name: str(o.name), type: str(o.reaction_type) ?? str(o.type), source: str(o.source) }
  })
}

export async function getReaction(slug: string): Promise<{ slug: string; participants: ReactionParticipant[] }> {
  const o = asObj(await request(`/api/reactions/${encodeURIComponent(slug)}`))
  const participants = asArr(o.participants).map((row) => {
    const p = asObj(row)
    return {
      name: str(p.name),
      role: str(p.role),
      equivalents: typeof p.equivalents === "number" ? p.equivalents : null,
    }
  })
  return { slug, participants }
}

export async function scaleReaction(
  slug: string,
  anchorCas: string,
  anchorUnit: "g" | "mL" | "mmol" | "mol",
  anchorValue: number
): Promise<ReactionParticipant[]> {
  const params = new URLSearchParams({
    anchor_cas: anchorCas,
    anchor_unit: anchorUnit,
    anchor_value: String(anchorValue),
  })
  const payload = await request(`/api/reactions/${encodeURIComponent(slug)}/scale?${params.toString()}`)
  return asArr(asObj(payload).participants).map((row) => {
    const p = asObj(row)
    return { name: str(p.name), massG: num(p.mass_g) }
  })
}

export async function listAntoine(limit = 20, offset = 0): Promise<{ rows: AntoineRow[]; total: number }> {
  const payload = await request("/api/antoine")
  const all = asArr(asObj(payload).results)
  const rows = all.slice(offset, offset + limit).map((row) => {
    const o = asObj(row)
    return {
      cas: str(o.cas),
      name: str(o.name),
      smiles: str(o.smiles),
      a: num(o.a),
      b: num(o.b),
      c: num(o.c),
      minTemp: num(o.minimumTemperature),
      maxTemp: num(o.maximumTemperature),
    }
  })
  return { rows, total: all.length }
}

export async function listAzeotropes(limit = 20, offset = 0): Promise<{ rows: AzeotropeRow[]; total: number }> {
  const payload = await request("/api/azeotropes")
  const all = asArr(asObj(payload).results)
  const rows = all.slice(offset, offset + limit).map((row) => {
    const o = asObj(row)
    const components = asArr(o.components)
      .map((c) => str(asObj(c).name))
      .filter((x): x is string => typeof x === "string")
    return {
      components,
      type: str(o.type),
      temperatureC: num(o.temperatureC),
      pressure: str(asObj(o.pressure).text),
    }
  })
  return { rows, total: all.length }
}

// ---------------------------------------------------------------- formatters

export function formatSummary(m: MoleculeSummary, index?: number): string {
  const bits = [m.name ?? "(unnamed)", m.cas ? `CAS ${m.cas}` : undefined, m.formula]
    .filter(Boolean)
    .join(" · ")
  const mass = m.molarMass !== undefined ? ` — ${m.molarMass} g/mol` : ""
  const sim = m.similarity !== undefined ? ` — similarity ${m.similarity.toFixed(3)}` : ""
  return `${index !== undefined ? `${index + 1}. ` : ""}${bits}${mass}${sim}`
}

export function formatSearch(r: SearchResult): string {
  if (r.results.length === 0) return "No compounds matched."
  const header = r.total !== undefined ? `${r.results.length} shown of ~${r.total}${r.capped ? "+" : ""}` : `${r.results.length} results`
  return `${header}\n\n${r.results.map((m, i) => formatSummary(m, i)).join("\n")}`
}

export function formatMolecule(m: Molecule): string {
  const lines = [
    m.name ?? "(unnamed)",
    m.cas ? `CAS: ${m.cas}` : undefined,
    m.formula ? `Formula: ${m.formula}` : undefined,
    m.molarMass !== undefined ? `Molar mass: ${m.molarMass} g/mol` : undefined,
    m.exactMass !== undefined ? `Exact mass: ${m.exactMass}` : undefined,
    m.density ? `Density: ${m.density}` : undefined,
    m.meltingPoint ? `Melting point: ${m.meltingPoint}` : undefined,
    m.boilingPoint ? `Boiling point: ${m.boilingPoint}` : undefined,
    m.smiles ? `SMILES: ${m.smiles}` : undefined,
    m.inchiKey ? `InChIKey: ${m.inchiKey}` : undefined,
    m.imageUrl ? `Structure image: ${m.imageUrl}` : undefined,
  ].filter((x): x is string => typeof x === "string")
  return lines.join("\n")
}

export function formatIdentify(r: IdentifyResult): string {
  if (!r.name && !r.cas) return "No catalogue match for that structure."
  return [
    `Match: ${r.name ?? "(unnamed)"}${r.cas ? ` (CAS ${r.cas})` : ""}`,
    r.sameStereo === undefined ? undefined : `Same stereoisomer: ${r.sameStereo ? "yes" : "no"}`,
    r.structureKey ? `Structure key: ${r.structureKey}` : undefined,
  ]
    .filter((x): x is string => typeof x === "string")
    .join("\n")
}

export function formatResolved(rows: ResolvedCompound[]): string {
  if (rows.length === 0) return "Nothing resolved."
  return rows
    .map((r) => {
      const head = `${r.term ?? "?"} -> ${r.name ?? "no match"}${r.cas ? ` (CAS ${r.cas})` : ""}`
      const extra = [
        r.formula,
        r.molarMass !== undefined ? `${r.molarMass} g/mol` : undefined,
        r.signalWord ? `GHS: ${r.signalWord}` : undefined,
      ]
        .filter(Boolean)
        .join(" · ")
      const hazards = r.hazards && r.hazards.length > 0 ? `\n   ${r.hazards.join("\n   ")}` : ""
      return `${head}${extra ? `\n   ${extra}` : ""}${hazards}`
    })
    .join("\n")
}

export function formatReactionList(rows: ReactionSummary[]): string {
  if (rows.length === 0) return "No reactions matched."
  return rows
    .map((r, i) => `${i + 1}. ${r.slug ?? "(no slug)"}${r.name ? ` — ${r.name}` : ""}${r.type ? ` [${r.type}]` : ""}`)
    .join("\n")
}

export function formatParticipants(slug: string, rows: ReactionParticipant[]): string {
  if (rows.length === 0) return `No participants returned for ${slug}.`
  return `${slug}\n\n${rows
    .map((p, i) => {
      const eq = p.equivalents === null || p.equivalents === undefined ? "" : ` · ${p.equivalents} eq`
      const mass = p.massG !== undefined ? ` · ${p.massG.toFixed(3)} g` : ""
      return `${i + 1}. ${p.name ?? "(unnamed)"} [${p.role ?? "?"}]${eq}${mass}`
    })
    .join("\n")}`
}

export function formatAntoine(rows: AntoineRow[], total: number): string {
  if (rows.length === 0) return "No Antoine rows returned."
  return `${rows.length} of ${total} sets\n\n${rows
    .map((r, i) => {
      const range =
        r.minTemp !== undefined && r.maxTemp !== undefined ? ` · ${r.minTemp}–${r.maxTemp} °C` : ""
      return `${i + 1}. ${r.name ?? "(unnamed)"}${r.cas ? ` (${r.cas})` : ""} — A=${r.a ?? "?"} B=${r.b ?? "?"} C=${r.c ?? "?"}${range}`
    })
    .join("\n")}`
}

export function formatAzeotropes(rows: AzeotropeRow[], total: number): string {
  if (rows.length === 0) return "No azeotropes returned."
  return `${rows.length} of ${total} binary azeotropes\n\n${rows
    .map((r, i) => {
      const comps = (r.components ?? []).join(" / ")
      const t = r.temperatureC !== undefined ? ` · ${r.temperatureC} °C` : ""
      return `${i + 1}. ${comps}${r.type ? ` [${r.type}]` : ""}${t}`
    })
    .join("\n")}`
}
