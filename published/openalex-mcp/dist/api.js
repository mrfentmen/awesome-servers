const BASE = "https://api.openalex.org";
const headers = { "User-Agent": "mrfentmen-openalex-mcp/1.0 (https://github.com/mrfentmen)" };
export class OpenAlexError extends Error {
}
async function request(path) { const res = await fetch(`${BASE}${path}`, { headers, signal: AbortSignal.timeout(20000) }); if (!res.ok)
    throw new OpenAlexError(`OpenAlex error ${res.status}`); return (await res.json()); }
export function searchWorks(query, limit = 10) { return request(`/works?search=${encodeURIComponent(query)}&per-page=${limit}`); }
export function getWork(id) { return request(`/works/${encodeURIComponent(id.replace(/^.*\/(works\/)?/, "").replace(/\.json$/, ""))}`); }
export function searchAuthors(query, limit = 10) { return request(`/authors?search=${encodeURIComponent(query)}&per-page=${limit}`); }
export function getAuthor(id) { return request(`/authors/${encodeURIComponent(id.replace(/^.*\/(authors\/)?/, "").replace(/\.json$/, ""))}`); }
export function formatWork(w, index) { return [`${index === undefined ? "" : `${index + 1}. `}${w.title ?? "Untitled"}`, w.publication_year ? `Year: ${w.publication_year}` : "", w.doi ? `DOI: ${w.doi}` : "", `Citations: ${w.cited_by_count ?? 0}`, w.open_access?.is_oa ? `Open access: yes${w.open_access.oa_url ? ` (${w.open_access.oa_url})` : ""}` : "Open access: no", w.primary_location?.source?.display_name ? `Venue: ${w.primary_location.source.display_name}` : "", w.authorships?.length ? `Authors: ${w.authorships.slice(0, 12).map((a) => a.author?.display_name).filter(Boolean).join(", ")}` : "", w.concepts?.length ? `Topics: ${w.concepts.slice(0, 8).map((c) => c.display_name).filter(Boolean).join(", ")}` : ""].filter(Boolean).join("\n"); }
export function formatAuthor(a, index) { return [`${index === undefined ? "" : `${index + 1}. `}${a.display_name ?? "Unknown author"}`, a.orcid ? `ORCID: ${a.orcid}` : "", `Works: ${a.works_count ?? 0}`, `Citations: ${a.cited_by_count ?? 0}`, a.last_known_institutions?.length ? `Institutions: ${a.last_known_institutions.map((i) => i.display_name).filter(Boolean).join(", ")}` : "", a.x_concepts?.length ? `Topics: ${a.x_concepts.slice(0, 8).map((c) => c.display_name).filter(Boolean).join(", ")}` : ""].filter(Boolean).join("\n"); }
