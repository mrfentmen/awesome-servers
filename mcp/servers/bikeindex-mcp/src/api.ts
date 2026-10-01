const BASE = 'https://bikeindex.org/api/v3';
const UA = 'mrfentmen-bikeindex-mcp/1.0';

export interface SearchArgs {
  query: string;
  limit?: number;
}

export interface BikeArgs {
  id: number;
}

export async function search(args: SearchArgs): Promise<string> {
  const query = (args.query ?? '').trim();
  if (!query) return 'Provide search terms.';
  const limit = Math.min(Math.max(Number(args.limit ?? 10) || 10, 1), 25);
  const res = await fetch(`${BASE}/search?per_page=${limit}&query=${encodeURIComponent(query)}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Bike Index returned ${res.status}`);
  const d = (await res.json()) as { bikes?: Array<{ id?: number; title?: string; serial?: string; date_stolen?: number; status?: string }> };
  const bikes = d.bikes ?? [];
  if (!bikes.length) return `No bikes found for "${query}".`;
  const fmt = (ts?: number) => (ts ? new Date(ts * 1000).toISOString().slice(0, 10) : 'unknown');
  return `Bike Index results for "${query}":\n` +
    bikes.slice(0, limit).map((b, i) => `${i + 1}. ${b.title ?? 'Unnamed bike'} (id=${b.id ?? '?'}, stolen ${fmt(b.date_stolen)})`).join('\n');
}

export async function bike(args: BikeArgs): Promise<string> {
  const id = Number(args.id);
  if (!Number.isFinite(id) || id <= 0) return 'Provide a bike id.';
  const res = await fetch(`${BASE}/bikes/${id}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Bike Index returned ${res.status}`);
  const d = (await res.json()) as {
    bike?: {
      id?: number;
      title?: string;
      serial?: string;
      status?: string;
      date_stolen?: number;
      frame_colors?: string[];
      manufacturer_name?: string;
      frame_model?: string;
      year?: number;
      description?: string;
      thumb?: string;
    };
  };
  const b = d.bike ?? {};
  return [
    `Bike #${b.id ?? id}`,
    `Title: ${b.title ?? '?'}`,
    `Manufacturer: ${b.manufacturer_name ?? '?'} ${b.frame_model ?? ''} (${b.year ?? '?'})`.trim(),
    b.frame_colors?.length ? `Colors: ${b.frame_colors.join(', ')}` : null,
    `Status: ${b.status ?? '?'}`,
    b.date_stolen ? `Stolen: ${new Date(b.date_stolen * 1000).toISOString().slice(0, 10)}` : 'Not reported stolen',
    b.serial ? `Serial: ${b.serial}` : null,
    b.description ? `Description: ${b.description}` : null,
    b.thumb ? `Photo: ${b.thumb}` : null,
  ].filter(Boolean).join('\n');
}

// ---- muxA tools:

const BI = "https://bikeindex.org/api/v3";

function cap(value: number | undefined, fallback: number, max: number): number {
  return Math.max(1, Math.min(Math.round(value ?? fallback), max));
}

function day(ts: unknown): string {
  const n = Number(ts);
  return Number.isFinite(n) && n > 0 ? new Date(n * 1000).toISOString().slice(0, 10) : "not recorded";
}

function line(b: Record<string, any>, i: number): string {
  const loc = [b.city, b.state, b.country].filter(Boolean).join(", ");
  return [
    `${i + 1}. ${b.title ?? "Unnamed bike"} (id ${b.id ?? "?"})`,
    `   ${b.manufacturer_name ?? "?"} ${b.frame_model ?? ""}`.trimEnd() +
      `${Array.isArray(b.frame_colors) && b.frame_colors.length ? ` | colour ${b.frame_colors.join(", ")}` : ""}` +
      `${b.cycle_type ? ` | ${String(b.cycle_type).replace(/_/g, " ")}` : ""}`,
    `   ${b.status ?? "?"}${b.stolen ? " | stolen" : ""}${b.date_stolen ? ` on ${day(b.date_stolen)}` : ""}${loc ? ` | last seen ${loc}` : ""}` +
      `${b.serial ? ` | serial ${b.serial}` : ""}`,
    b.description ? `   ${String(b.description).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 180)}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

async function biSearch(params: Record<string, string>): Promise<{ bikes: Array<Record<string, any>> }> {
  const query = new URLSearchParams(params);
  const res = await fetch(`${BI}/search?${query.toString()}`, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Bike Index returned ${res.status}`);
  // The endpoint returns a bare bikes array with no total, so counts are what we fetched.
  const d = (await res.json()) as { bikes?: Array<Record<string, any>> };
  return { bikes: d.bikes ?? [] };
}

export interface StolenArgs {
  limit?: number;
  page?: number;
  days_ago?: number;
}

export interface NearbyArgs {
  lat: number;
  lon: number;
  distance?: number;
  stolen_only?: boolean;
  limit?: number;
}

export interface MakerArgs {
  manufacturer?: string;
  search_catalogue?: boolean;
  limit?: number;
}

export async function manufacturerCatalogue(args: MakerArgs): Promise<string> {
  const name = (args.manufacturer ?? "").trim();
  if (!name) throw new Error("Provide a manufacturer name, e.g. Trek or Surly.");
  const limit = cap(args.limit, 15, 50);
  if (args.search_catalogue === true) {
    const res = await fetch(`${BI}/manufacturers?per_page=${Math.max(limit, 50)}`, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) throw new Error(`Bike Index returned ${res.status}`);
    const d = (await res.json()) as { manufacturers?: Array<Record<string, any>> };
    const all = d.manufacturers ?? [];
    const q = name.toLowerCase();
    const rows = all.filter((m) => String(m.name ?? "").toLowerCase().includes(q));
    if (!rows.length) {
      const sample = all.slice(0, 15).map((m) => String(m.name)).join(", ");
      return `No Bike Index manufacturer matches "${name}". The catalogue returns ${all.length} entries, for example: ${sample}.`;
    }
    return [
      `Bike Index manufacturers matching "${name}": ${rows.length} of ${all.length} in the catalogue page.`,
      ...rows.map(
        (m, i) =>
          `${i + 1}. ${m.name ?? "?"}${m.country ? ` | ${m.country}` : ""}${m.frame_type ? ` | ${m.frame_type}` : ""}` +
          `${m.about ? ` | ${String(m.about).replace(/<[^>]*>/g, " ").slice(0, 90)}` : ""}${m.company_url ? ` | ${m.company_url}` : ""}`,
      ),
    ].join("\n");
  }
  const { bikes } = await biSearch({ manufacturer: name, per_page: String(limit) });
  if (!bikes.length) return `Bike Index has no registered bikes for manufacturer "${name}".`;
  const models = new Map<string, number>();
  for (const b of bikes) {
    const k = String(b.frame_model ?? "model not recorded");
    models.set(k, (models.get(k) ?? 0) + 1);
  }
  return [
    `Bikes on Bike Index from ${name}: ${bikes.length} record(s) returned.`,
    `Frame models here: ${[...models.entries()].slice(0, 8).map(([k, v]) => `${k} ${v}`).join(", ") || "not recorded"}.`,
    ...bikes.map((b, i) => line(b, i)),
  ].join("\n");
}
