
export interface m1_SearchArgs {
  query: string;
  limit?: number;
}

const m0 = (() => {
const API = "https://www.wikidata.org/w/api.php"
const SPARQL = "https://query.wikidata.org/sparql"
const H = { "User-Agent": "mrfentmen-wikidata-mcp/1.0 (https://github.com/mrfentmen)" }
class WikidataError extends Error {}
async function search(query: string) { const u = new URL(API); Object.entries({ action: "wbsearchentities", search: query, language: "en", format: "json", limit: "10" }).forEach(([k, v]) => u.searchParams.set(k, v)); const r = await fetch(u, { headers: H, signal: AbortSignal.timeout(20000) }); if (!r.ok) throw new WikidataError(`Wikidata error ${r.status}`); return r.json() }
async function entity(id: string) { const u = new URL(API); Object.entries({ action: "wbgetentities", ids: id, languages: "en", format: "json", props: "labels|descriptions|claims|sitelinks" }).forEach(([k, v]) => u.searchParams.set(k, v)); const r = await fetch(u, { headers: H, signal: AbortSignal.timeout(20000) }); if (!r.ok) throw new WikidataError(`Wikidata error ${r.status}`); return r.json() }
async function sparql(query: string) { if (query.length > 8000 || /SERVICE|LOAD|INSERT|DELETE|CLEAR|DROP|CREATE|WITH/i.test(query)) throw new WikidataError("Only bounded read-only SPARQL is allowed; query is too large or contains a prohibited operation."); const u = new URL(SPARQL); u.searchParams.set("query", query); u.searchParams.set("format", "json"); const r = await fetch(u, { headers: { ...H, Accept: "application/sparql-results+json" }, signal: AbortSignal.timeout(60000) }); if (!r.ok) throw new WikidataError(`Wikidata SPARQL error ${r.status}`); return r.json() }
function format(x: unknown) { return JSON.stringify(x, null, 2).slice(0, 16000) }

return { WikidataError, entity, format, search, sparql };
})();

const m1 = (() => {
const BASE = 'https://www.wikidata.org/w/api.php';


async function search(args: m1_SearchArgs): Promise<string> {
  const q = (args.query ?? '').trim();
  if (!q) return 'Provide search terms.';
  const limit = Math.max(1, Math.min(args.limit ?? 10, 25));
  const params = new URLSearchParams({
    action: 'wbsearchentities',
    search: q,
    language: 'en',
    format: 'json',
    limit: String(limit),
  });
  const res = await fetch(`${BASE}?${params.toString()}`, {
    headers: { 'User-Agent': 'mrfentmen-wikidata-search-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Wikidata returned ${res.status}`);
  const data = (await res.json()) as { search?: Array<{ id?: string; label?: string; description?: string; url?: string }> };
  const rows = data.search ?? [];
  if (!rows.length) return `No Wikidata entities found for "${q}".`;
  return `Wikidata entities for "${q}" (${rows.length} shown):\n` +
    rows
      .map((r, i) => `${i + 1}. ${r.label ?? ''} (${r.id ?? ''})${r.description ? ` | ${r.description}` : ''}${r.url ? `\n   ${r.url}` : ''}`)
      .join('\n');
}

return { search };
})();

export const WikidataError = m0.WikidataError;
export const entity = m0.entity;
export const format = m0.format;
export const search = m0.search;
export const sparql = m0.sparql;
export const m0_sparql = m0.sparql;
export const m0_entity = m0.entity;
export const m0_search = m0.search;
export const m0_format = m0.format;
export const m0_WikidataError = m0.WikidataError;
export const m1_search = m1.search;

// ---- muxC tools:

const WD_UA = "mrfentmen-wikidata-mcp/1.0 (https://github.com/mrfentmen)"

class WikidataToolError extends Error {}

async function wd(params: Record<string, string>, ms = 25000): Promise<any> {
  const p = new URLSearchParams({ format: "json", formatversion: "2", ...params })
  const res = await fetch(`https://www.wikidata.org/w/api.php?${p.toString()}`, { headers: { "User-Agent": WD_UA, Accept: "application/json" }, signal: AbortSignal.timeout(ms) })
  if (!res.ok) throw new WikidataToolError(`Wikidata's api returned ${res.status}`)
  const d = (await res.json()) as any
  if (d?.error) throw new WikidataToolError(`Wikidata: ${d.error.info ?? "error"}`)
  return d
}

function qid(v: string | undefined): string {
  const id = (v ?? "").trim().toUpperCase()
  if (!id) throw new WikidataToolError("Provide a Wikidata Q id, e.g. Q64")
  if (!/^Q\d+$/.test(id)) throw new WikidataToolError("A Wikidata item id looks like Q64")
  return id
}

/** The Wikipedia editions an item sits in, which the label and claim views never show. */
export async function entitySitelinks(args: { id?: string; limit?: number }): Promise<string> {
  const id = qid(args.id)
  const d = await wd({ action: "wbgetentities", ids: id, props: "sitelinks" })
  const links = d?.entities?.[id]?.sitelinks
  if (!links) return `Wikidata item ${id} has no sitelinks.`
  const rows = Object.values(links) as any[]
  const limit = Math.max(1, Math.min(args.limit ?? 20, 300))
  const bySite = new Map<string, string[]>()
  for (const l of rows) {
    const key = String(l.site ?? "unknown")
    if (!bySite.has(key)) bySite.set(key, [])
    bySite.get(key)!.push(l.title)
  }
  return `${id} appears in ${bySite.size} wikis (${rows.length} sitelinks, ${limit} shown):\n` +
    [...bySite].slice(0, limit).map(([site, titles]) => `  ${site}: ${titles.slice(0, 3).join(", ")}`).join("\n")
}

/** An item's revision history, which shows who changed it and when. */
export async function entityHistory(args: { id?: string; limit?: number }): Promise<string> {
  const id = qid(args.id)
  const limit = Math.max(1, Math.min(args.limit ?? 10, 50))
  const d = await wd({ action: "query", prop: "revisions", titles: id, rvlimit: String(limit), rvprop: "timestamp|user|comment|ids|size" })
  const page = d?.query?.pages?.[0]
  const revs: any[] = page?.revisions ?? []
  if (!revs.length) return `Wikidata has no revision history for ${id}.`
  return `Revision history of ${page.title ?? id} (${revs.length} shown, newest first):\n` +
    revs.map((r, i) => `${i + 1}. ${String(r.timestamp ?? "").replace("T", " ").slice(0, 19)} by ${r.user ?? "anonymous"}\n   revision ${r.revid ?? "?"} | ${r.size != null ? `${r.size} bytes` : "size not reported"}${r.comment ? `\n   ${String(r.comment).replace(/\s+/g, " ").slice(0, 160)}` : ""}`).join("\n")
}
