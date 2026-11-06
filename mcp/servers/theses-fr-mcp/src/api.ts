/**
 * theses.fr — the French national registry of doctoral theses, run by ABES.
 * Keyless, no signup.
 *
 * One endpoint only: `api/v1/theses/recherche/` with `q`, `nombre` and `debut`.
 * Verified limits:
 *  - there is no per-record route (`/api/v1/theses/<id>` answers 404), so a
 *    single thesis is fetched by asking the search index for its id — an exact
 *    match on `id` or `nnt` is required before anything is printed.
 *  - no filtering: `annee`, `discipline`, `status`, `etablissement` and the
 *    `filtres` JSON parameter all leave `totalHits` unchanged.
 *  - no sorting: `tri=pertinence|date|dateSoutenance` all return the same order.
 *  - no facets: the response carries only `totalHits`, `took` and `theses`.
 * None of those are exposed, rather than faked.
 */
const API = "https://theses.fr/api/v1/theses/recherche/"
const SITE = "https://theses.fr"

export class ThesesError extends Error {}

interface Person {
  ppn?: string | null
  nom?: string | null
  prenom?: string | null
}

interface Subject {
  langue?: string
  libelle?: string
  ppn?: string
}

interface NamedRef {
  ppn?: string
  nom?: string
  type?: string | null
}

interface Thesis {
  id?: string
  nnt?: string | null
  titrePrincipal?: string
  titreEN?: string
  dateSoutenance?: string | null
  datePremiereInscriptionDoctorat?: string | null
  etabSoutenanceN?: string
  discipline?: string
  status?: string
  doi?: string | null
  auteurs?: Person[]
  directeurs?: Person[]
  rapporteurs?: Person[]
  examinateurs?: Person[]
  president?: Person
  ecolesDoctorale?: NamedRef[]
  partenairesDeRecherche?: NamedRef[]
  sujets?: Subject[]
  sujetsRameau?: Subject[]
}

interface SearchResponse {
  totalHits?: number
  theses?: Thesis[]
}

async function request(params: URLSearchParams, timeoutMs = 30000): Promise<SearchResponse> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(`${API}?${params.toString()}`, {
      signal: ctrl.signal,
      headers: { "user-agent": "theses-fr-mcp", accept: "application/json" },
    })
    const type = (res.headers.get("content-type") ?? "").toLowerCase()
    if (!res.ok) throw new ThesesError(`theses.fr responded ${res.status}`)
    if (!type.includes("json")) throw new ThesesError("theses.fr returned an unexpected page")
    return (await res.json()) as SearchResponse
  } catch (e) {
    if (e instanceof ThesesError) throw e
    if ((e as Error).name === "AbortError") throw new ThesesError("theses.fr request timed out")
    throw new ThesesError(`theses.fr request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}

/* --------------------------------------------------------------- helpers */

const clamp = (n: number, lo: number, hi: number): number => (Number.isInteger(n) ? Math.min(hi, Math.max(lo, n)) : lo)

const decode = (s: string): string =>
  s
    .replace(/<[^>]+>/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim()

const personName = (p: Person | undefined): string =>
  p ? [p.prenom ?? "", p.nom ?? ""].map((s) => s.trim()).filter((s) => s !== "").join(" ") : ""

function people(list: Person[] | undefined, max = 6): string {
  const names = (list ?? []).map(personName).filter((n) => n !== "")
  if (names.length === 0) return ""
  return names.length > max ? `${names.slice(0, max).join("; ")} +${names.length - max} more` : names.join("; ")
}

const subjectLabels = (list: Subject[] | undefined): string[] =>
  (list ?? []).map((s) => (s.libelle ?? "").trim()).filter((s) => s !== "")

const refNames = (list: NamedRef[] | undefined): string[] =>
  (list ?? []).map((r) => (r.nom ?? "").trim()).filter((s) => s !== "")

const statusLabel = (s: string | undefined): string => (s === "soutenue" ? "defended" : s === "enCours" ? "in progress" : (s ?? "status unknown"))

function cleanId(input: string): string {
  const v = input
    .trim()
    .replace(/^https?:\/\/[^/]+\//i, "")
    .replace(/\/$/, "")
  if (!/^[A-Za-z0-9]{4,24}$/.test(v)) {
    throw new ThesesError(`"${input}" is not a thesis id — expected an NNT like 2016REN1S112 or an id like s431762`)
  }
  return v
}

/* ----------------------------------------------------------------- tools */

export async function search(query: string, limit = 10, page = 1): Promise<string> {
  const q = query.trim()
  if (q === "") throw new ThesesError("q must not be empty — theses.fr returns nothing for a blank search")

  const size = clamp(limit, 1, 100)
  const num = Number.isInteger(page) && page > 0 ? page : 1
  const params = new URLSearchParams({
    q,
    nombre: String(size),
    debut: String((num - 1) * size),
  })

  const data = await request(params)
  const total = data.totalHits ?? 0
  const rows = data.theses ?? []
  if (total === 0) return `No theses.fr record matches "${q}".`
  if (rows.length === 0) return `"${q}" has ${total} records, but page ${num} is past the end.`

  const start = (num - 1) * size + 1
  const lines = rows.map((t, i) => {
    const authors = people(t.auteurs)
    const meta = [
      authors || "no author listed",
      t.dateSoutenance ? `defended ${t.dateSoutenance}` : "not defended yet",
      t.etabSoutenanceN ?? "",
      t.discipline ?? "",
      statusLabel(t.status),
    ]
      .filter((p) => p !== "")
      .join(" · ")
    return `${start + i}. [${t.id ?? t.nnt ?? "no id"}] ${decode(t.titrePrincipal ?? "(untitled)")}\n   ${meta}`
  })

  return [`"${q}" — ${total} theses, showing ${start}-${start + rows.length - 1}`, "", ...lines].join("\n")
}

export async function record(id: string): Promise<string> {
  const clean = cleanId(id)
  const params = new URLSearchParams({ q: clean, nombre: "5", debut: "0" })
  const data = await request(params)
  const rows = data.theses ?? []
  const t = rows.find((x) => x.id === clean || x.nnt === clean)
  if (!t) throw new ThesesError(`theses.fr has no thesis with id ${clean}`)

  const key = t.nnt ?? t.id ?? clean
  const authors = people(t.auteurs)
  const supervisors = people(t.directeurs)
  const rapporteurs = people(t.rapporteurs)
  const examiners = people(t.examinateurs)
  const president = personName(t.president)
  const schools = refNames(t.ecolesDoctorale).join("; ")
  const partners = refNames(t.partenairesDeRecherche).join("; ")
  const subjects = subjectLabels(t.sujets).join(", ")
  const rameau = subjectLabels(t.sujetsRameau).join(", ")
  const english = (t.titreEN ?? "").trim()
  const main = decode(t.titrePrincipal ?? "")

  return [
    main || "(no title in the record)",
    "",
    english !== "" && english.toLowerCase() !== main.toLowerCase() ? `English title: ${decode(english)}` : "",
    `Author: ${authors || "none listed"}`,
    supervisors ? `Supervisors: ${supervisors}` : "",
    rapporteurs ? `Rapporteurs: ${rapporteurs}` : "",
    examiners ? `Examiners: ${examiners}` : "",
    president ? `Jury president: ${president}` : "",
    t.etabSoutenanceN ? `University: ${t.etabSoutenanceN}` : "",
    schools ? `Doctoral school: ${schools}` : "",
    partners ? `Partners: ${partners}` : "",
    t.discipline ? `Discipline: ${t.discipline}` : "",
    t.dateSoutenance ? `Defended: ${t.dateSoutenance}` : "Defended: not yet",
    t.datePremiereInscriptionDoctorat ? `First registered: ${t.datePremiereInscriptionDoctorat}` : "",
    `Status: ${statusLabel(t.status)}`,
    t.nnt ? `NNT: ${t.nnt}` : "",
    t.doi ? `DOI: ${t.doi}` : "",
    subjects ? `Subjects: ${subjects}` : "",
    rameau ? `Rameau subjects: ${rameau}` : "",
    `Page: ${SITE}/${key}`,
  ]
    .filter((line) => line !== "")
    .join("\n")
}
