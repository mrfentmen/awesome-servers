const BASE = 'https://ssd-api.jpl.nasa.gov/fireball.api';

export interface RecentArgs {
  limit?: number;
}

export async function recent(args: RecentArgs): Promise<string> {
  const limit = Math.max(1, Math.min(args.limit ?? 10, 25));
  const res = await fetch(`${BASE}?limit=${limit}`, {
    headers: { 'User-Agent': 'mrfentmen-jpl-fireball-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`JPL returned ${res.status}`);
  const d = (await res.json()) as { count?: number; fields?: string[]; data?: Array<Array<string>> };
  const fields = d.fields ?? [];
  const rows = (d.data ?? []).slice(0, limit);
  if (!rows.length) return 'No fireballs returned.';
  const get = (r: string[], k: string) => r[fields.indexOf(k)] ?? '';
  return `Recent fireball impacts (${rows.length} shown):\n` +
    rows
      .map((r, i) => {
        const energy = Number(get(r, 'energy')) > 0 ? ` | ${get(r, 'energy')} kt` : '';
        return `${i + 1}. ${get(r, 'date').replace('T', ' ')} | impact ${get(r, 'lat')},${get(r, 'lon')}${energy}${get(r, 'vel') ? ` | ${get(r, 'vel')} km/s` : ''}`;
      })
      .join('\n');
}

// ---- muxC tools:

// The fireball API splits a position into value and hemisphere across two
// fields (lat + lat-dir, lon + lon-dir), so a readable row needs both.
function fireballRow(fields: string[], r: string[]): string {
  const get = (k: string): string => r[fields.indexOf(k)] ?? ""
  const energy = Number(get("energy"))
  const impact = Number(get("impact-e"))
  const alt = Number(get("alt"))
  const vel = Number(get("vel"))
  const position = `${get("lat")}${get("lat-dir")}, ${get("lon")}${get("lon-dir")}`
  const parts = [get("date").replace("T", " "), `impact ${position}`]
  if (energy > 0) parts.push(`energy ${energy} kt`)
  if (impact > 0) parts.push(`inbound impact energy ${impact} kt`)
  if (alt > 0) parts.push(`altitude ${alt} km`)
  if (vel > 0) parts.push(`${vel} km/s`)
  return parts.join(" | ")
}

async function fireballGet(query: string): Promise<{ fields: string[]; rows: string[][]; count: number }> {
  const res = await fetch(`${BASE}${query}`, {
    headers: { "User-Agent": "mrfentmen-jpl-fireball-mcp/1.0", Accept: "application/json" },
    signal: AbortSignal.timeout(30000),
  })
  if (!res.ok) throw new Error(`JPL returned ${res.status}`)
  const d = (await res.json()) as { count?: number; fields?: string[]; data?: Array<Array<string>>; message?: string }
  if (d.message) throw new Error(`JPL rejected the query: ${d.message}`)
  return { fields: d.fields ?? [], rows: d.data ?? [], count: Number(d.count ?? 0) }
}

