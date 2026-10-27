
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

