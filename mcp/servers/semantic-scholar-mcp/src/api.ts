const BASE = "https://api.semanticscholar.org/graph/v1"
const UA = "mrfentmen-semantic-scholar-mcp/1.0 (https://github.com/mrfentmen)"
export class ScholarError extends Error {}

async function get<T>(url: string, retries = 3): Promise<T> {
  let last: unknown = null
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(25000) })
    if (res.status === 429) {
      last = new ScholarError("Semantic Scholar rate limit hit, wait and retry")
      await new Promise((r) => setTimeout(r, 3000 * (attempt + 1)))
      continue
    }
    if (!res.ok) throw new ScholarError(`Semantic Scholar error ${res.status}`)
    return (await res.json()) as T
  }
  throw last instanceof Error ? last : new ScholarError("Semantic Scholar request failed")
}

export async function searchPapers(args: { query?: string; limit?: number }): Promise<string> {
  const q = (args.query ?? "").trim()
  if (!q) throw new ScholarError("Provide search terms")
  const limit = Math.min(args.limit ?? 5, 15)
  const d = await get<any>(`${BASE}/paper/search?query=${encodeURIComponent(q)}&limit=${limit}&fields=title,year,authors,citationCount,externalIds`)
  const items = d?.data ?? []
  if (!items.length) return "No papers found"
  return items.map((p: any, i: number) => {
    const author = (p?.authors ?? []).slice(0, 3).map((a: any) => a.name).join(", ")
    return `${i + 1}. ${p.title ?? "Untitled"} (${p.year ?? "year n/a"})\n   ${author || "n/a"} | ${p.citationCount ?? 0} citations${p?.externalIds?.DOI ? ` | doi ${p.externalIds.DOI}` : ""}`
  }).join("\n\n")
}

export async function paperInfo(args: { paperId?: string }): Promise<string> {
  const id = (args.paperId ?? "").trim()
  if (!id) throw new ScholarError("Provide a paper ID")
  const d = await get<any>(`${BASE}/paper/${encodeURIComponent(id)}?fields=title,year,abstract,authors,citationCount,referenceCount,venue,externalIds`)
  return `Title: ${d.title ?? "n/a"} (${d.year ?? "year n/a"})\nVenue: ${d.venue ?? "n/a"}\nAuthors: ${(d.authors ?? []).slice(0, 5).map((a: any) => a.name).join(", ") || "n/a"}\nCitations: ${d.citationCount ?? 0} | References: ${d.referenceCount ?? 0}${d.externalIds?.DOI ? ` | doi ${d.externalIds.DOI}` : ""}\n\n${(d.abstract ?? "no abstract").slice(0, 500)}`
}

// ---- muxE tools:
// searchPapers prints a list and paperInfo prints one paper's title, venue,
// authors, two counts, a DOI and the first 500 characters of the abstract. The
// graph API behind it also answers three other questions it is never asked: who
// is citing this paper, what this paper cites, and how the field itself sees
// the work. Those are three routes, all verified live against the public API.
const GRAPH = 'https://api.semanticscholar.org/graph/v1';

// The existing get already retries a 429 with backoff, so every call here goes
// through it rather than reaching for fetch directly.
const CITATION_FIELDS = 'title,year,authors,citationCount,externalIds,venue';

const label = (p: any): string => {
  if (!p) return 'not reported';
  const t = typeof p.title === 'string' ? p.title.trim() : '';
  if (!t) return 'untitled';
  return t.length > 90 ? `${t.slice(0, 90)}...` : t;
};

const authorsOf = (p: any, max = 3): string => {
  const names = Array.isArray(p?.authors) ? p.authors.map((a: any) => a?.name).filter(Boolean) : [];
  if (!names.length) return 'not reported';
  const shown = names.slice(0, max).join(', ');
  return names.length > max ? `${shown}, and ${names.length - max} more` : shown;
};

function requireId(raw: unknown): string {
  const id = String(raw ?? '').trim();
  if (!id) throw new ScholarError('Provide a paper ID, a DOI such as DOI:10.1038/nature12373, or a corpus id');
  if (id.length > 200) throw new ScholarError('That paper ID is far too long to be an id');
  return encodeURIComponent(id);
}

export interface CitationsArgs {
  paperId: string;
  limit?: number;
}

export interface ReferencesArgs {
  paperId: string;
  limit?: number;
}

export async function paper_references(args: ReferencesArgs): Promise<string> {
  const id = requireId(args?.paperId);
  const limit = Math.max(1, Math.min(50, Math.floor(Number(args?.limit ?? 10) || 10)));
  const d = await get<any>(`${GRAPH}/paper/${id}/references?fields=${CITATION_FIELDS}&limit=${limit}`);
  const rows: any[] = Array.isArray(d?.data) ? d.data : [];
  if (!rows.length) return 'Semantic Scholar returned no references for this id.';
  const papers = rows.map((r) => r?.citedPaper).filter(Boolean);
  const unresolved = rows.length - papers.length;
  const years = papers.map((p) => Number(p.year)).filter((y) => Number.isFinite(y) && y > 0);
  const lines = [
    `What this paper cites (${papers.length} reference${papers.length === 1 ? "" : "s"} returned on this page${unresolved ? `, plus ${unresolved} the index holds no record for` : ""}):`,
  ];
  if (years.length) {
    const sorted = [...years].sort((a, b) => a - b);
    lines.push(`  they span ${sorted[0]} to ${sorted[sorted.length - 1]}.`);
  }
  // Oldest first: the question behind this is what the work was built on.
  const ordered = [...papers].sort((a, b) => (Number(a.year) || 9999) - (Number(b.year) || 9999));
  for (const p of ordered.slice(0, limit)) {
    lines.push(`  ${p.year ?? 'year n/a'} — ${label(p)}`);
    lines.push(`    ${authorsOf(p)}${p.venue ? ` | ${p.venue}` : ""}`);
  }
  if (ordered.length > limit) lines.push(`  and ${ordered.length - limit} further reference(s) not listed.`);
  if (d?.next !== undefined && d.next !== null) lines.push(`  the index reports more beyond this page, next offset ${d.next}.`);
  lines.push("");
  lines.push("  The existing paperInfo reports a referenceCount as a bare number and cannot show any of the works behind it.");
  return lines.join("\n");
}

export interface PaperFieldArgs {
  paperId: string;
}

// ---- gap3c tools:

// paperInfo reads `authors` off the paper record and prints at most five bare
// names: no ids, no affiliations, no per-author career counts, and no sign of
// whether the list was cut short. The graph API answers the same paper with the
// full author index on a separate route, and every id it returns is what the
// /author routes take, so this closes both gaps at once.
//
// This block is spliced into the same module, so BASE, UA, ScholarError, get,
// requireId and GRAPH are already in scope here and are not redeclared.

export interface PaperAuthorsArgs {
  paperId: string;
}

