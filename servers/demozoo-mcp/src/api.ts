/**
 * Demozoo API v1 client, keyless.
 * Docs: https://demozoo.org/api/v1/ (browse the root URL for the endpoint list)
 */
const BASE = "https://demozoo.org/api/v1"

export class DemozooError extends Error {}

interface NickRef {
  name: string
  releaser?: { id: number; name: string; is_group: boolean }
}

export interface ProductionSummary {
  id: number
  title: string
  authors: string[]
  release_date?: string
  supertype?: string
  platforms: string[]
  types: string[]
  demozoo_url?: string
}

export interface ProductionDetails extends ProductionSummary {
  credits: string[]
  download_links: string[]
}

export interface Releaser {
  id: number
  name: string
  is_group: boolean
  nicks: string[]
  member_of: string[]
  members: string[]
  demozoo_url?: string
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "User-Agent": "demozoo-mcp/1.0" },
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new DemozooError(`Demozoo error ${res.status}`)
  return (await res.json()) as T
}

interface Paged<T> {
  count: number
  results: T[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

const names = (arr: unknown): string[] =>
  Array.isArray(arr) ? arr.map((x) => String((x as Raw)?.name ?? x)) : []

export function toSummary(p: Raw): ProductionSummary {
  return {
    id: p.id,
    title: String(p.title ?? "(untitled)"),
    authors: Array.isArray(p.author_nicks) ? p.author_nicks.map((n: NickRef) => n.name) : [],
    release_date: p.release_date,
    supertype: p.supertype,
    platforms: names(p.platforms),
    types: names(p.types),
    demozoo_url: p.demozoo_url,
  }
}

export async function searchProductions(query: string, limit = 5): Promise<ProductionSummary[]> {
  const data = await getJson<Paged<Raw>>(`/productions/?query=${encodeURIComponent(query)}`)
  return data.results.slice(0, limit).map(toSummary)
}

export async function getProduction(id: string): Promise<ProductionDetails | null> {
  if (!/^\d+$/.test(id.trim())) throw new DemozooError(`Production id must be numeric, got "${id}".`)
  const p = await getJson<Raw>(`/productions/${id.trim()}/`)
  if (!p || p.id === undefined) return null
  const s = toSummary(p)
  return {
    ...s,
    credits: Array.isArray(p.credits)
      ? p.credits.map((c: Raw) => `${c?.nick?.name ?? "?"} — ${c?.category ?? "?"}`).slice(0, 12)
      : [],
    download_links: Array.isArray(p.download_links)
      ? p.download_links.map((d: Raw) => String(d.url)).slice(0, 8)
      : [],
  }
}

export async function getReleaser(id: string): Promise<Releaser | null> {
  if (!/^\d+$/.test(id.trim())) throw new DemozooError(`Releaser id must be numeric, got "${id}".`)
  const r = await getJson<Raw>(`/releasers/${id.trim()}/`)
  if (!r || r.id === undefined) return null
  return {
    id: r.id,
    name: String(r.name ?? "?"),
    is_group: Boolean(r.is_group),
    nicks: Array.isArray(r.nicks) ? r.nicks.map((n: Raw) => String(n.name)) : [],
    member_of: Array.isArray(r.member_of) ? r.member_of.map((m: Raw) => String(m?.group?.name ?? "?")) : [],
    members: Array.isArray(r.members) ? r.members.map((m: Raw) => String(m?.nick?.name ?? "?")).slice(0, 15) : [],
    demozoo_url: r.demozoo_url,
  }
}

export function formatSummary(p: ProductionSummary, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  const by = p.authors.length ? ` by ${p.authors.slice(0, 3).join(", ")}` : ""
  const meta = [p.release_date, p.platforms.slice(0, 3).join("/"), p.types.slice(0, 2).join(", ")]
    .filter(Boolean)
    .join(" · ")
  return `${prefix}[${p.id}] ${p.title}${by}${meta ? ` (${meta})` : ""}`
}

export function formatProduction(p: ProductionDetails): string {
  const lines = [
    `[${p.id}] ${p.title}`,
    p.authors.length ? `By: ${p.authors.join(", ")}` : "",
    p.release_date ? `Released: ${p.release_date}` : "",
    p.platforms.length ? `Platforms: ${p.platforms.join(", ")}` : "",
    p.types.length ? `Type: ${p.types.join(", ")}` : "",
    p.credits.length ? `Credits:\n- ${p.credits.join("\n- ")}` : "",
    p.download_links.length ? `Downloads:\n- ${p.download_links.join("\n- ")}` : "",
    p.demozoo_url ? `More: ${p.demozoo_url}` : "",
  ].filter(Boolean)
  return lines.join("\n")
}

export function formatReleaser(r: Releaser): string {
  const lines = [
    `[${r.id}] ${r.name} (${r.is_group ? "group" : "scener"})`,
    r.nicks.length > 1 ? `Nicks: ${r.nicks.join(", ")}` : "",
    r.member_of.length ? `Member of: ${r.member_of.join(", ")}` : "",
    r.members.length ? `Members: ${r.members.join(", ")}` : "",
    r.demozoo_url ? `More: ${r.demozoo_url}` : "",
  ].filter(Boolean)
  return lines.join("\n")
}

// ---- muxA tools:

const DEMOZOO = "https://demozoo.org/api/v1";

function cap(value: number | undefined, fallback: number, max: number): number {
  return Math.max(1, Math.min(Math.round(value ?? fallback), max));
}

export interface ReleaserProductionsArgs {
  releaser_id: number;
  limit?: number;
}

export interface PlatformArgs {
  platform: string;
  limit?: number;
  start_year?: number;
}

export interface CatalogueArgs {
  include_platforms?: boolean;
  search?: string;
  limit?: number;
}

export async function referenceCatalogue(args: CatalogueArgs): Promise<string> {
  const limit = cap(args.limit, 30, 100);
  const wantPlatforms = args.include_platforms !== false;
  const q = (args.search ?? "").trim().toLowerCase();
  const out: string[] = [];
  const types = await getJson<Paged<Raw>>(`/production_types/?page_size=${Math.max(limit, 60)}`);
  let typeRows = types.results ?? [];
  if (q) typeRows = typeRows.filter((t) => String(t.name ?? "").toLowerCase().includes(q));
  const supertypes = new Map<string, number>();
  for (const t of types.results ?? []) {
    const k = String(t.supertype ?? "unspecified");
    supertypes.set(k, (supertypes.get(k) ?? 0) + 1);
  }
  out.push(
    `Demozoo production types: ${Number(types.count ?? typeRows.length).toLocaleString("en-US")} defined` +
      `${q ? `, ${typeRows.length} match "${q}"` : ""}. Supertypes: ${[...supertypes.entries()].map(([k, v]) => `${k} ${v}`).join(", ")}`,
  );
  for (const t of typeRows.slice(0, limit)) out.push(`  [${t.id}] ${String(t.name ?? "?")} | supertype ${t.supertype ?? "?"}`);
  if (wantPlatforms) {
    const platforms = await getJson<Paged<Raw>>("/platforms/?page_size=200");
    let platRows = platforms.results ?? [];
    if (q) platRows = platRows.filter((p) => String(p.name ?? "").toLowerCase().includes(q));
    out.push("");
    out.push(`Demozoo platforms: ${Number(platforms.count ?? platRows.length).toLocaleString("en-US")} defined${q ? `, ${platRows.length} match "${q}"` : ""}.`);
    for (const p of platRows.slice(0, limit)) out.push(`  [${p.id}] ${String(p.name ?? "?")}`);
  }
  return out.join("\n");
}

export interface PartiesArgs {
  kind?: string;
  query?: string;
  limit?: number;
  start_year?: number;
}

export async function partiesAndScenes(args: PartiesArgs): Promise<string> {
  const kind = (args.kind ?? "parties").trim().toLowerCase();
  if (!["parties", "bbses", "party_series"].includes(kind)) {
    return `Unknown kind "${args.kind}". Use parties, party_series or bbses.`;
  }
  const limit = cap(args.limit, 20, 50);
  const path = kind === "bbses" ? "/bbses/" : kind === "party_series" ? "/party_series/" : "/parties/";
  const query = new URLSearchParams({ page_size: String(Math.max(limit, 50)) });
  if (args.query?.trim()) query.set("query", args.query.trim());
  const data = await getJson<Paged<Raw>>(`${path}?${query.toString()}`);
  let rows = data.results ?? [];
  const all = Number(data.count ?? rows.length);
  const year = Number(args.start_year);
  if (Number.isFinite(year) && year > 1900) {
    rows = rows.filter((p) => Number(String(p.start_date ?? "").slice(0, 4)) >= year);
  }
  if (!rows.length) {
    return `Demozoo ${kind} returned ${all.toLocaleString("en-US")} record(s) but none matched the filters.`;
  }
  const shown = rows.slice(0, limit);
  const label = kind === "bbses" ? "bulletin board systems" : kind === "party_series" ? "party series" : "parties";
  return [
    `Demozoo ${label} matching ${args.query ? `"${args.query}"` : "any"}${Number.isFinite(year) && year > 1900 ? ` from ${Math.round(year)} onwards` : ""}: ${all.toLocaleString("en-US")} in the index, showing ${shown.length}.`,
    ...shown.map((p, i) => {
      const bits = [
        `${i + 1}. [${p.id}] ${String(p.name ?? "?")}`,
        p.start_date ? `dates ${String(p.start_date).slice(0, 10)}${p.end_date ? ` to ${String(p.end_date).slice(0, 10)}` : ""}` : "",
        p.location ? `location ${String(p.location).slice(0, 60)}` : "",
        p.website ? `website ${String(p.website).slice(0, 50)}` : "",
        p.tagline ? `tagline ${String(p.tagline).slice(0, 60)}` : "",
        p.demozoo_url ? `${p.demozoo_url}` : "",
      ];
      return bits.filter(Boolean).join(" | ");
    }),
  ].join("\n");
}
