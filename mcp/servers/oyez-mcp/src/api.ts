/**
 * Oyez API client, keyless.
 * Docs: https://github.com/oyez/oyez-api
 */
const BASE = "https://api.oyez.org"

export class OyezError extends Error {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "User-Agent": "oyez-mcp/1.0", Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 404) throw new OyezError("Not found on Oyez.")
  if (!res.ok) throw new OyezError(`Oyez error ${res.status}`)
  return (await res.json()) as T
}

const clean = (s: unknown, max: number): string | undefined => {
  if (typeof s !== "string" || !s) return undefined
  const t = s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()
  return t ? (t.length > max ? t.slice(0, max) + "..." : t) : undefined
}

export interface CaseHit {
  name: string
  term?: string
  docket?: string
  href?: string
}

export async function searchCases(query: string, limit = 5): Promise<CaseHit[]> {
  const rows = await getJson<Raw[]>(`/cases/search/${encodeURIComponent(query)}`)
  return rows.slice(0, limit).map((r) => ({
    name: clean(r.name, 120) ?? "?",
    term: r.term ? String(r.term) : undefined,
    docket: r.docket_number ? String(r.docket_number) : undefined,
    href: r.href,
  }))
}

export interface CaseDetails {
  name?: string
  docket?: string
  parties: string[]
  facts?: string
  question?: string
  conclusion?: string
  decisions: string[]
  audio: string[]
  url?: string
}

export async function getCase(term: string, docket: string): Promise<CaseDetails> {
  const c = await getJson<Raw>(`/cases/${encodeURIComponent(term.trim())}/${encodeURIComponent(docket.trim())}`)
  const decisions: Raw[] = Array.isArray(c.decisions) ? c.decisions : []
  const args: Raw[] = Array.isArray(c.oral_argument_audio) ? c.oral_argument_audio : []
  return {
    name: clean(c.name, 140),
    docket: c.docket_number ? String(c.docket_number) : undefined,
    parties: [c.first_party, c.second_party].filter((x) => typeof x === "string").map(String),
    facts: clean(c.facts_of_the_case, 500),
    question: clean(c.question, 300),
    conclusion: clean(c.conclusion, 300),
    decisions: decisions.slice(0, 6).map((d) => {
      const votes = d.votes ? ` (${String(d.votes)})` : ""
      const member = d.member ? ` — ${String((d.member as Raw).name ?? d.member)}` : ""
      return `${String(d.decision_type ?? "Decision")}${votes}${member}`
    }),
    audio: args.slice(0, 4).map((a) => String(a.href ?? a)).filter(Boolean),
    url: c.href ? String(c.href).replace("api.oyez.org", "www.oyez.org/cases") : undefined,
  }
}

export function formatHit(h: CaseHit, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  return `${prefix}${h.name}${h.term && h.docket ? ` (term ${h.term}, docket ${h.docket})` : ""}`
}

export function formatCase(c: CaseDetails): string {
  const lines = [
    `${c.name ?? "(unnamed case)"}${c.docket ? ` [${c.docket}]` : ""}`,
    c.parties.length ? `Parties: ${c.parties.join(" v. ")}` : "",
    c.question ? `Question: ${c.question}` : "",
    c.conclusion ? `Conclusion: ${c.conclusion}` : "",
    c.decisions.length ? `Decisions:\n- ${c.decisions.join("\n- ")}` : "",
    c.audio.length ? `Oral argument audio:\n- ${c.audio.join("\n- ")}` : "",
    c.facts ? `Facts: ${c.facts}` : "",
    c.url ? `More: ${c.url}` : "",
  ].filter(Boolean)
  return lines.join("\n")
}

// ---- muxE tools:
// Two things were learned from the live API and shape everything below.
//
// First, the search endpoint returns ten fields per row: ID, citation,
// description, docket_number, href, justia_url, name, question, term, timeline
// and view_count. The existing searchCases keeps only name, term, docket_number
// and href, so the citation, the question presented, the description, the
// decided date and the Justia mirror are all fetched and then discarded. The
// three new tools are those discarded fields, made readable.
//
// Second, the search relevance is heavily skewed toward older terms, and it is
// not a topical ranking a caller can rely on: a search for "dobbs" returns a
// 1966 trucking case. So none of these tools claims to be exhaustive, and each
// one reports the term spread it actually saw rather than implying it found
// everything.

// BASE and clean already exist in this module, as does OyezError, and this pack
// is appended into it, so all three are reused as they are.

interface Row {
  ID?: number;
  name?: string;
  term?: string | number;
  docket_number?: string;
  citation?: { volume?: string; page?: string; year?: string | number; href?: string } | null;
  question?: string | null;
  description?: string | null;
  timeline?: Array<{ event?: string; dates?: number[] }> | null;
  justia_url?: string | null;
  href?: string | null;
  view_count?: number | null;
}

async function search(query: string, limit: number): Promise<Row[]> {
  const res = await fetch(`${BASE}/cases/search/${encodeURIComponent(query)}`, {
    headers: { "User-Agent": "oyez-mcp/1.0", Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  });
  if (res.status === 404) throw new OyezError(`Oyez has no cases matching "${query}".`);
  if (!res.ok) throw new OyezError(`Oyez error ${res.status} for "${query}".`);
  const body = (await res.json()) as Row[] | Row;
  const rows = Array.isArray(body) ? body : [body];
  if (!rows.length) throw new OyezError(`Oyez returned no cases for "${query}".`);
  return rows.slice(0, limit);
}

function boundLimit(raw: unknown, fallback: number, max: number): number {
  const n = Math.floor(Number(raw ?? fallback));
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(n, max);
}

// The citation is an object of separate volume, page and year fields, and the
// U.S. Reports form is the three of them joined.
function formatCitation(c: Row["citation"]): string | null {
  if (!c) return null;
  const vol = clean(c.volume, 8);
  const page = clean(c.page, 8);
  if (!vol && !page) return null;
  const year = c.year === undefined || c.year === null ? "" : String(c.year).trim();
  const core = vol && page ? `${vol} U.S. ${page}` : `${vol ?? page} U.S.`;
  return year ? `${core} (${year})` : core;
}

// The timeline dates are Unix seconds, which is why a raw read gives a decade
// of seconds with no year in it.
function decidedDate(row: Row): string | null {
  for (const e of row.timeline ?? []) {
    if (!/decid/i.test(e.event ?? "")) continue;
    const d = e.dates?.[0];
    if (typeof d === "number" && Number.isFinite(d)) {
      const iso = new Date(d * 1000).toISOString();
      return iso.slice(0, 10);
    }
  }
  return null;
}

function termLabel(row: Row): string {
  const t = row.term;
  return t === undefined || t === null || t === "" ? "unreported" : String(t);
}

export interface CaseCitationsArgs {
  query: string;
  limit?: number;
}

export interface CaseQuestionsArgs {
  query: string;
  limit?: number;
}

export interface CitationLookupArgs {
  volume: string;
  page: string;
  limit?: number;
}

export function citation_lookup(args: CitationLookupArgs): Promise<string> {
  const vol = typeof args?.volume === "string" ? args.volume.trim() : "";
  const page = typeof args?.page === "string" ? args.page.trim() : "";
  if (!vol) throw new OyezError("Give the U.S. Reports volume, for example 382.");
  if (!page) throw new OyezError("Give the U.S. Reports first page, for example 372.");
  if (!/^\d{1,4}$/.test(vol)) throw new OyezError(`Volume must be a number, you gave "${vol.slice(0, 20)}".`);
  if (!/^\d{1,4}$/.test(page)) throw new OyezError(`Page must be a number, you gave "${page.slice(0, 20)}".`);
  // The search endpoint has no citation filter, so the numeric parts are used
  // as the query and the rows are then matched on the citation field itself.
  // That means a miss here is a miss of the search ranking, not proof of
  // absence, and the output says so.
  const query = `${vol} ${page}`;
  const limit = boundLimit(args?.limit, 40, 100);
  return search(query, limit).then((rows) => {
    const exact = rows.filter((r) => {
      const c = r.citation;
      if (!c) return false;
      return String(c.volume ?? "").trim() === vol && String(c.page ?? "").trim() === page;
    });
    const lines = [
      `Looking up U.S. Reports ${vol} U.S. ${page} among ${rows.length} Oyez search result(s) for "${query}":`,
      "",
    ];
    if (!exact.length) {
      lines.push("  No result carries that exact volume and page.");
      const near = rows
        .map((r) => ({ r, c: r.citation }))
        .filter((x) => x.c && String(x.c.volume ?? "").trim() === vol)
        .slice(0, 8);
      if (near.length) {
        lines.push(`  ${near.length} result(s) are in volume ${vol} at other pages, which is where a misremembered page would show up:`);
        for (const { r, c } of near) {
          lines.push(`    ${formatCitation(c)?.padEnd(26)}${clean(r.name, 70) ?? "unnamed case"}`);
        }
      } else {
        lines.push(`  No result is in volume ${vol} at all.`);
      }
      lines.push("");
      lines.push("  Oyez relevance-skews old and does not search citations directly, so this is not proof the case is absent; try the case name instead.");
      return lines.join("\n");
    }
    lines.push(`  ${exact.length} exact match${exact.length === 1 ? "" : "es"}:`);
    for (const r of exact) {
      const name = clean(r.name, 90) ?? "unnamed case";
      lines.push(`    ${name}`);
      lines.push(`      citation ${formatCitation(r.citation)}, term ${termLabel(r)}, docket ${clean(r.docket_number, 20) ?? "unreported"}`);
      const decided = decidedDate(r);
      if (decided) lines.push(`      decided ${decided}`);
      const q = clean(r.question, 260);
      if (q) lines.push(`      question presented: ${q}`);
      if (r.justia_url) lines.push(`      full text: ${r.justia_url}`);
      else if (r.href) lines.push(`      Oyez record: ${r.href}`);
    }
    return lines.join("\n");
  });
}

// ---- gap3b tools:

// The timeline array on a search row is fetched and then read for one value:
// decidedDate walks it looking only for an event matching /decid/i, so Argued,
// Reargued and Granted are dropped even when Oyez has them. This reports the
// whole array, and puts the wait between argued and decided on the record,
// which is the thing the decided date alone cannot say.

// Oyez stores timeline dates as Unix seconds. A pre-1970 decision comes back as
// a negative number - Brown v Board is -84758400 - so a "must be positive" guard
// would throw away most of the Court's history rather than defend against
// anything. Only a non-finite value is rejected.

export interface CaseTimelineArgs {
  query: string;
  limit?: number;
}

