/**
 * NamSor API v2 client — onomastics for personal names: likely gender,
 * country of origin, diaspora/ethnicity, US race/ethnicity from name+ZIP,
 * and Chinese/Japanese romanisation candidates.
 *
 * Docs: https://v2.namsor.com/NamSorAPIv2/apidoc.html
 */
const BASE = "https://v2.namsor.com/NamSorAPIv2"

export class NamSorError extends Error {}

export interface NameInput {
  id?: string
  firstName: string
  lastName: string
}

export interface GenderPrediction {
  id?: string
  firstName?: string
  lastName?: string
  likelyGender?: string
  genderScale?: number
  score?: number
  probabilityCalibrated?: number
}

export interface CountryPrediction {
  id?: string
  firstName?: string
  lastName?: string
  country?: string
  countryIso2?: string
  countryScale?: number
  score?: number
  probabilityCalibrated?: number
}

export interface EthnicityScore {
  ethnicity: string
  score?: number
}

export interface DiasporaPrediction {
  id?: string
  firstName?: string
  lastName?: string
  countryIso2?: string
  ethnicities: EthnicityScore[]
}

export interface RaceEthnicityScore {
  race: string
  score?: number
}

export interface UsRaceEthnicityPrediction {
  id?: string
  firstName?: string
  lastName?: string
  race?: string
  ethnicity?: string
  raceEthnicities: RaceEthnicityScore[]
}

export interface NameCandidates {
  id?: string
  names: string[]
  score?: number
}

/* ---------------------------------------------------------------- helpers */

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v)
}

function field(obj: unknown, key: string): unknown {
  return isRecord(obj) ? obj[key] : undefined
}

function s(obj: unknown, key: string): string | undefined {
  const v = field(obj, key)
  return typeof v === "string" && v.length > 0 ? v : undefined
}

function n(obj: unknown, key: string): number | undefined {
  const v = field(obj, key)
  return typeof v === "number" && Number.isFinite(v) ? v : undefined
}

function asArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : []
}

/** Batch payloads come back wrapped in one of several envelopes. */
function pickArray(v: unknown, keys: string[]): unknown[] {
  if (Array.isArray(v)) return v
  for (const k of keys) {
    const got = field(v, k)
    if (Array.isArray(got)) return got
  }
  return asArray(field(v, "data"))
}

function enc(segment: string): string {
  return encodeURIComponent(segment)
}

function tryParse(raw: string): unknown | null {
  try {
    return JSON.parse(raw) as unknown
  } catch {
    return null
  }
}

function apiKey(): string {
  const key = process.env.NAMSOR_API_KEY
  if (!key) {
    throw new NamSorError(
      "NAMSOR_API_KEY is not set. Create a key at https://v2.namsor.com/NamSorAPIv2/apidoc.html and export NAMSOR_API_KEY."
    )
  }
  return key
}

async function request(
  path: string,
  init?: { method?: string; body?: unknown }
): Promise<unknown> {
  const hasBody = init?.body !== undefined
  const res = await fetch(`${BASE}${path}`, {
    method: init?.method ?? "GET",
    headers: {
      "X-API-KEY": apiKey(),
      Accept: "application/json",
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
    },
    body: hasBody ? JSON.stringify(init?.body) : undefined,
    signal: AbortSignal.timeout(25000),
  })

  const raw = await res.text()

  if (!res.ok) {
    let detail = raw.slice(0, 300)
    const parsed = tryParse(raw)
    const msg = s(parsed, "message") ?? s(parsed, "error") ?? s(parsed, "description")
    if (msg) detail = msg
    throw new NamSorError(`NamSor error ${res.status} for ${path}: ${detail}`)
  }

  if (!raw.trim()) return {}
  const body = tryParse(raw)
  if (body === null) throw new NamSorError(`NamSor returned non-JSON for ${path}`)
  return body
}

/* ---------------------------------------------------------------- parsers */

function parseGender(v: unknown): GenderPrediction {
  return {
    id: s(v, "id"),
    firstName: s(v, "firstName"),
    lastName: s(v, "lastName"),
    likelyGender: s(v, "likelyGender") ?? s(v, "gender"),
    genderScale: n(v, "genderScale"),
    score: n(v, "score"),
    probabilityCalibrated: n(v, "probabilityCalibrated"),
  }
}

function parseCountry(v: unknown): CountryPrediction {
  return {
    id: s(v, "id"),
    firstName: s(v, "firstName"),
    lastName: s(v, "lastName"),
    country: s(v, "country"),
    countryIso2: s(v, "countryIso2"),
    countryScale: n(v, "countryScale"),
    score: n(v, "score"),
    probabilityCalibrated: n(v, "probabilityCalibrated"),
  }
}

function parseEthnicities(v: unknown): EthnicityScore[] {
  const out: EthnicityScore[] = []
  for (const item of asArray(field(v, "ethnicities"))) {
    const ethnicity = s(item, "ethnicity") ?? s(item, "name")
    if (ethnicity) out.push({ ethnicity, score: n(item, "score") })
  }
  return out
}

function parseDiaspora(v: unknown): DiasporaPrediction {
  const single = s(v, "ethnicity")
  const ethnicities = parseEthnicities(v)
  if (ethnicities.length === 0 && single) {
    ethnicities.push({ ethnicity: single, score: n(v, "score") })
  }
  return {
    id: s(v, "id"),
    firstName: s(v, "firstName"),
    lastName: s(v, "lastName"),
    countryIso2: s(v, "countryIso2"),
    ethnicities,
  }
}

function parseRaceEthnicities(v: unknown): RaceEthnicityScore[] {
  const fromArray: RaceEthnicityScore[] = []
  for (const item of asArray(field(v, "raceEthnicities"))) {
    const race = s(item, "race") ?? s(item, "ethnicity") ?? s(item, "name")
    if (race) fromArray.push({ race, score: n(item, "score") })
  }
  if (fromArray.length > 0) return fromArray

  const single = s(v, "race") ?? s(v, "ethnicity")
  return single ? [{ race: single, score: n(v, "score") }] : []
}

function parseUsRaceEthnicity(v: unknown): UsRaceEthnicityPrediction {
  return {
    id: s(v, "id"),
    firstName: s(v, "firstName"),
    lastName: s(v, "lastName"),
    race: s(v, "race"),
    ethnicity: s(v, "ethnicity"),
    raceEthnicities: parseRaceEthnicities(v),
  }
}

function parseCandidates(v: unknown, keys: string[]): NameCandidates {
  const names = pickArray(v, keys)
    .map((item) => (typeof item === "string" ? item : s(item, "name")))
    .filter((x): x is string => typeof x === "string" && x.length > 0)
  return { id: s(v, "id"), names, score: n(v, "score") }
}

/* -------------------------------------------------------------------- API */

export async function getApiStatus(): Promise<unknown> {
  return request("/api2/json/apiStatus")
}

export async function getApiUsage(): Promise<unknown> {
  return request("/api2/json/apiUsage")
}

export async function getApiKeyInfo(): Promise<unknown> {
  return request("/api2/json/apiKeyInfo")
}

export async function listApiServices(): Promise<unknown> {
  return request("/api2/json/apiServices")
}

export async function inferGender(
  firstName: string,
  lastName?: string
): Promise<GenderPrediction> {
  const path = lastName
    ? `/api2/json/gender/${enc(firstName)}/${enc(lastName)}`
    : `/api2/json/gender/${enc(firstName)}`
  return parseGender(await request(path))
}

export async function inferGenderFull(fullName: string): Promise<GenderPrediction> {
  return parseGender(await request(`/api2/json/genderFull/${enc(fullName)}`))
}

export async function inferGenderFullGeo(
  fullName: string,
  countryIso2: string
): Promise<GenderPrediction> {
  return parseGender(
    await request(`/api2/json/genderFullGeo/${enc(fullName)}/${enc(countryIso2)}`)
  )
}

export async function inferGenderBatch(names: NameInput[]): Promise<GenderPrediction[]> {
  const body = await request("/api2/json/genderBatch", {
    method: "POST",
    body: { personalNames: names },
  })
  return pickArray(body, ["personalNames", "names"]).map(parseGender)
}

export async function inferCountry(personalNameFull: string): Promise<CountryPrediction> {
  return parseCountry(await request(`/api2/json/country/${enc(personalNameFull)}`))
}

export async function inferCountryBatch(names: NameInput[]): Promise<CountryPrediction[]> {
  const body = await request("/api2/json/countryBatch", {
    method: "POST",
    body: { personalNames: names },
  })
  return pickArray(body, ["personalNames", "names"]).map(parseCountry)
}

export async function inferDiaspora(
  countryIso2: string,
  firstName: string,
  lastName: string
): Promise<DiasporaPrediction> {
  return parseDiaspora(
    await request(
      `/api2/json/diaspora/${enc(countryIso2)}/${enc(firstName)}/${enc(lastName)}`
    )
  )
}

export async function inferDiasporaBatch(
  names: NameInput[]
): Promise<DiasporaPrediction[]> {
  const body = await request("/api2/json/diasporaBatch", {
    method: "POST",
    body: { personalNames: names },
  })
  return pickArray(body, ["personalNames", "names"]).map(parseDiaspora)
}

export async function inferUsRaceEthnicity(
  firstNameLastName: string,
  zip5Code: string,
  countryIso2: string
): Promise<UsRaceEthnicityPrediction> {
  return parseUsRaceEthnicity(
    await request(
      `/api2/json/usRaceEthnicityZIP5/${enc(firstNameLastName)}/${enc(zip5Code)}/${enc(countryIso2)}`
    )
  )
}

export async function inferUsRaceEthnicityBatch(
  names: NameInput[]
): Promise<UsRaceEthnicityPrediction[]> {
  const body = await request("/api2/json/usRaceEthnicityBatch", {
    method: "POST",
    body: { personalNames: names },
  })
  return pickArray(body, ["personalNames", "names"]).map(parseUsRaceEthnicity)
}

export async function chineseNameCandidates(
  chineseSurnameLatin: string,
  chineseGivenNameLatin: string
): Promise<NameCandidates> {
  return parseCandidates(
    await request(
      `/api2/json/chineseNameCandidates/${enc(chineseSurnameLatin)}/${enc(chineseGivenNameLatin)}`
    ),
    ["names", "candidates"]
  )
}

export async function matchChineseName(
  chineseSurnameLatin: string,
  chineseGivenNameLatin: string,
  chineseName: string
): Promise<unknown> {
  return request(
    `/api2/json/chineseNameMatch/${enc(chineseSurnameLatin)}/${enc(chineseGivenNameLatin)}/${enc(chineseName)}`
  )
}

export async function japaneseNameKanjiCandidates(
  japaneseSurnameLatin: string,
  japaneseGivenNameLatin: string
): Promise<NameCandidates> {
  return parseCandidates(
    await request(
      `/api2/json/japaneseNameKanjiCandidates/${enc(japaneseSurnameLatin)}/${enc(japaneseGivenNameLatin)}`
    ),
    ["names", "candidates"]
  )
}

/* -------------------------------------------------------------- formatters */

function confidence(v: number | undefined): string {
  if (v === undefined) return "confidence n/a"
  return `confidence ${Math.round(v * 1000) / 10}%`
}

function fullName(first?: string, last?: string): string {
  const joined = [first, last].filter((x): x is string => !!x).join(" ")
  return joined.length > 0 ? joined : "(unnamed)"
}

export function formatGender(g: GenderPrediction, index?: number): string {
  const lines = [
    `${index !== undefined ? `${index + 1}. ` : ""}${fullName(g.firstName, g.lastName)} — ${g.likelyGender ?? "unknown"}`,
    [confidence(g.probabilityCalibrated), g.score !== undefined ? `score ${g.score}` : ""]
      .filter(Boolean)
      .join(", "),
  ]
  return lines.filter(Boolean).join("\n")
}

export function formatCountry(c: CountryPrediction, index?: number): string {
  const lines = [
    `${index !== undefined ? `${index + 1}. ` : ""}${fullName(c.firstName, c.lastName)} — ${c.country ?? c.countryIso2 ?? "unknown country"}`,
    [
      c.countryIso2 && c.country ? `ISO2 ${c.countryIso2}` : "",
      confidence(c.probabilityCalibrated),
      c.score !== undefined ? `score ${c.score}` : "",
    ]
      .filter(Boolean)
      .join(", "),
  ]
  return lines.filter(Boolean).join("\n")
}

export function formatDiaspora(d: DiasporaPrediction, index?: number): string {
  const list =
    d.ethnicities.length > 0
      ? d.ethnicities
          .map((e) => (e.score !== undefined ? `${e.ethnicity} (${Math.round(e.score * 1000) / 10}%)` : e.ethnicity))
          .join(", ")
      : "no ethnicity returned"
  return `${index !== undefined ? `${index + 1}. ` : ""}${fullName(d.firstName, d.lastName)} — ${list}`
}

export function formatUsRaceEthnicity(
  p: UsRaceEthnicityPrediction,
  index?: number
): string {
  const list =
    p.raceEthnicities.length > 0
      ? p.raceEthnicities
          .map((r) => (r.score !== undefined ? `${r.race} (${Math.round(r.score * 1000) / 10}%)` : r.race))
          .join(", ")
      : [p.race, p.ethnicity].filter(Boolean).join(", ") || "no race/ethnicity returned"
  return `${index !== undefined ? `${index + 1}. ` : ""}${fullName(p.firstName, p.lastName)} — ${list}`
}

export function formatCandidates(
  label: string,
  c: NameCandidates,
  index?: number
): string {
  const names = c.names.length > 0 ? c.names.join(", ") : "none"
  const head = `${index !== undefined ? `${index + 1}. ` : ""}${label}: ${names}`
  return c.score !== undefined ? `${head} (score ${c.score})` : head
}

export function formatBatch<T>(
  label: string,
  items: T[],
  format: (item: T, index: number) => string
): string {
  if (items.length === 0) return `No ${label} returned.`
  return `${items.length} ${label}:\n\n` + items.map((item, i) => format(item, i)).join("\n\n")
}

function flattenRecord(rec: Record<string, unknown>): string {
  return Object.entries(rec)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        const parts = value.map((item) =>
          isRecord(item) ? JSON.stringify(item) : String(item)
        )
        return `  ${key}: ${parts.join(", ")}`
      }
      if (isRecord(value)) return `  ${key}: ${JSON.stringify(value)}`
      return `  ${key}: ${String(value)}`
    })
    .join("\n")
}

/** Pretty-print an arbitrary API payload (status, usage, key info, services). */
export function formatFlat(title: string, value: unknown): string {
  if (Array.isArray(value)) {
    if (value.length === 0) return `${title}: (empty)`
    return (
      `${title} (${value.length}):\n` +
      value
        .map((item, i) =>
          isRecord(item) ? `${i + 1}. ${JSON.stringify(item)}` : `${i + 1}. ${String(item)}`
        )
        .join("\n")
    )
  }
  if (isRecord(value)) {
    const entries = Object.entries(value)
    if (entries.length === 0) return `${title}: (empty)`
    return `${title}:\n${flattenRecord(value)}`
  }
  return `${title}: ${String(value)}`
}
