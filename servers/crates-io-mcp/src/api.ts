const BASE = "https://crates.io/api/v1"
const UA = "mrfentmen-crates-io-mcp/1.0 (https://github.com/mrfentmen)"
export class CratesError extends Error {}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(20000) })
  if (res.status === 429) throw new CratesError("crates.io rate limit hit, wait and retry")
  if (!res.ok) throw new CratesError(`crates.io error ${res.status}`)
  return (await res.json()) as T
}

export async function crateInfo(args: { name?: string }): Promise<string> {
  const name = (args.name ?? "").trim().toLowerCase()
  if (!name) throw new CratesError("Provide a crate name")
  const d = await get<any>(`${BASE}/crates/${encodeURIComponent(name)}`)
  const c = d?.crate
  if (!c) throw new CratesError("Crate not found")
  return `Crate: ${c.name}\nDescription: ${c.description ?? "n/a"}\nLatest version: ${c.max_version ?? "n/a"}\nDownloads: ${(c.downloads ?? 0).toLocaleString()} (recent: ${(c.recent_downloads ?? 0).toLocaleString()})\nUpdated: ${c.updated_at ? new Date(c.updated_at).toISOString().slice(0, 10) : "n/a"}\nHomepage: ${c.homepage ?? c.repository ?? "n/a"}`
}

export async function searchCrates(args: { query?: string; limit?: number }): Promise<string> {
  const q = (args.query ?? "").trim()
  if (!q) throw new CratesError("Provide search terms")
  const limit = Math.min(args.limit ?? 10, 30)
  const d = await get<any>(`${BASE}/crates?q=${encodeURIComponent(q)}&per_page=${limit}`)
  const crates = d?.crates ?? []
  if (!crates.length) return "No crates found"
  return crates.map((c: any, i: number) => `${i + 1}. ${c.name} ${c.max_version ?? ""}\n   ${(c.description ?? "").slice(0, 120)} | ${(c.downloads ?? 0).toLocaleString()} downloads`).join("\n\n")
}

// ---- muxA tools:

function clamp(value: number | undefined, fallback: number, max: number): number {
  return Math.max(1, Math.min(Math.round(value ?? fallback), max));
}

function num(n: unknown): string {
  return Number(n ?? 0).toLocaleString("en-US");
}

export interface VersionsArgs {
  name: string;
  limit?: number;
  include_yanked?: boolean;
}

export interface DepsArgs {
  name: string;
  version?: string;
}

export interface LandscapeArgs {
  sort?: string;
  limit?: number;
  compare?: string;
}

export async function crateLandscape(args: LandscapeArgs): Promise<string> {
  const sort = (args.sort ?? "downloads").trim().toLowerCase();
  const allowed = ["downloads", "recent-downloads", "newest", "updated"];
  if (!allowed.includes(sort)) {
    return `Unknown sort "${args.sort}". Use one of: ${allowed.join(", ")}.`;
  }
  const limit = clamp(args.limit, 10, 50);
  const d = await get<any>(`${BASE}/crates?sort=${encodeURIComponent(sort)}&per_page=${limit}`);
  const rows = (d?.crates ?? []) as Array<Record<string, any>>;
  if (!rows.length) return `crates.io returned no crates for sort=${sort}.`;
  const out = [`Most downloaded crates on crates.io (sort=${sort}), ${rows.length} shown.`];
  for (const [i, c] of rows.entries()) {
    out.push(
      `${i + 1}. ${c.name} | ${num(c.downloads)} total downloads | ${num(c.recent_downloads)} recent | v${c.max_version ?? "?"}` +
        `${c.description ? ` | ${String(c.description).slice(0, 90)}` : ""}`,
    );
  }
  const compare = (args.compare ?? "").trim();
  if (compare) {
    const names = compare.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean).slice(0, 10);
    if (!names.length) return out.join("\n");
    const s = await get<any>(`${BASE}/summary?${names.map((n) => `crate=${encodeURIComponent(n)}`).join("&")}`);
    out.push("", `Comparison from the crates.io summary endpoint (${num(s?.num_downloads)} downloads across ${num(s?.num_crates)} crates in total):`);
    for (const c of (s?.crates ?? []) as Array<Record<string, any>>) {
      out.push(
        `  ${c.name} | v${c.max_version ?? "?"} | ${num(c.downloads)} total | ${num(c.recent_downloads)} recent` +
          `${c.description ? ` | ${String(c.description).slice(0, 80)}` : ""}`,
      );
    }
  }
  return out.join("\n");
}
