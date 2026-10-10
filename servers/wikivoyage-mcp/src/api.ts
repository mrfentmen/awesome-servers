const BASE = 'https://en.wikivoyage.org/w/api.php';

export interface SearchArgs {
  query: string;
  limit?: number;
}

export async function search(args: SearchArgs): Promise<string> {
  const q = (args.query ?? '').trim();
  if (!q) return 'Provide search terms.';
  const limit = Math.max(1, Math.min(args.limit ?? 10, 25));
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    list: 'search',
    srsearch: q,
    srlimit: String(limit),
  });
  const res = await fetch(`${BASE}?${params.toString()}`, {
    headers: { 'User-Agent': 'mrfentmen-wikivoyage-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Wikivoyage returned ${res.status}`);
  const data = (await res.json()) as { query?: { search?: Array<{ title?: string; snippet?: string }> } };
  const rows = data.query?.search ?? [];
  if (!rows.length) return `No Wikivoyage guides found for "${q}".`;
  return `Wikivoyage guides for "${q}" (${rows.length} shown):\n` +
    rows
      .map((r, i) => `${i + 1}. ${r.title ?? ''}\n   ${(r.snippet ?? '').replace(/<[^>]*>/g, '')}`)
      .join('\n');
}

// ---- muxC tools:

const WIKI_UA = "mrfentmen-wikivoyage-mcp/1.0"

async function wikiGet<T>(params: Record<string, string>): Promise<T> {
  const search = new URLSearchParams({ format: "json", ...params })
  const res = await fetch(`${BASE}?${search.toString()}`, {
    headers: { "User-Agent": WIKI_UA, Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new Error(`Wikivoyage returned ${res.status}`)
  return (await res.json()) as T
}

/** The plain-text opening of a travel guide, with its coordinates if mapped. */
export async function guideArticle(args: { title?: string }): Promise<string> {
  const title = (args.title ?? "").trim()
  if (!title) throw new Error("Provide a page title, e.g. Tokyo or Lisbon")
  const d = await wikiGet<{
    query?: { pages?: Record<string, { title?: string; missing?: string; extract?: string; pageid?: number }> }
  }>({ action: "query", prop: "extracts|pageimages|coordinates", exintro: "1", explaintext: "1", redirects: "1", piprop: "name", titles: title })
  const pages = d.query?.pages ?? {}
  const page = Object.values(pages)[0]
  if (!page || page.missing !== undefined) return `Wikivoyage has no page titled "${title}".`
  const extract = (page.extract ?? "").trim()
  if (!extract) return `"${page.title}" has no plain-text extract.`
  return `# ${page.title}\n${extract.slice(0, 1800)}${extract.length > 1800 ? "\n…(truncated)" : ""}`
}

/** The table of contents of a guide, with per-section line numbers. */
export async function guideSections(args: { title?: string }): Promise<string> {
  const title = (args.title ?? "").trim()
  if (!title) throw new Error("Provide a page title, e.g. Tokyo or Lisbon")
  const d = await wikiGet<{ parse?: { title?: string; sections?: Array<{ line?: string; anchor?: string; level?: string }> }; error?: { info?: string } }>(
    { action: "parse", page: title, prop: "sections", redirects: "1" },
  )
  if (d.error) return `Wikivoyage has no page titled "${title}" (${d.error.info ?? "not found"}).`
  const sections = d.parse?.sections ?? []
  if (!sections.length) return `"${d.parse?.title ?? title}" has no sections.`
  const body = sections.filter((s) => (s.level ?? "") !== "0")
  return `Sections of ${d.parse?.title ?? title} (${body.length}):\n` +
    body.map((s) => `  ${"  ".repeat(Math.max(0, Number(s.level ?? 1) - 1))}# ${(s.line ?? "").trim()}`).join("\n")
}

/** Wikivoyage pages near a coordinate, nearest first, with the distance. */
export async function nearbyGuides(args: { lat?: number; lon?: number; limit?: number }): Promise<string> {
  const lat = Number(args.lat)
  const lon = Number(args.lon)
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) throw new Error("Provide lat between -90 and 90")
  if (!Number.isFinite(lon) || lon < -180 || lon > 180) throw new Error("Provide lon between -180 and 180")
  const limit = Math.max(1, Math.min(args.limit ?? 8, 25))
  const d = await wikiGet<{ query?: { geosearch?: Array<{ title?: string; lat?: number; lon?: number; dist?: number; primary?: string }> } }>({
    action: "query",
    list: "geosearch",
    gscoord: `${lat}|${lon}`,
    gslimit: String(limit),
  })
  const rows = d.query?.geosearch ?? []
  if (!rows.length) return `No Wikivoyage guides mapped near ${lat}, ${lon}.`
  return `Wikivoyage guides near ${lat}, ${lon} (${rows.length} found):\n` +
    rows.map((r, i) => `${i + 1}. ${r.title ?? "?"} - ${r.lat}, ${r.lon} (${r.dist ?? "?"} m away)${r.primary ? ` [${r.primary}]` : ""}`).join("\n")
}
