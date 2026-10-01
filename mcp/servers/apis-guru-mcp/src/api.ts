const BASE = 'https://api.apis.guru/v2';
const UA = 'mrfentmen-apis-guru-mcp/1.0 (https://github.com/mrfentmen)';
export class ApisGuruError extends Error {}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(25000) });
  if (!res.ok) throw new ApisGuruError(`APIs.guru returned ${res.status}`);
  return (await res.json()) as T;
}

export async function search(args: { query?: string; limit?: number }): Promise<string> {
  const q = (args.query ?? '').trim().toLowerCase();
  const limit = Math.max(1, Math.min(args.limit ?? 10, 30));
  const list = await get<Record<string, unknown>>(`${BASE}/list.json`);
  const names = Object.keys(list);
  const matched = q ? names.filter((n) => n.toLowerCase().includes(q)) : names;
  if (!matched.length) return `No APIs found${q ? ` for "${q}"` : ''}.`;
  const shown = matched.slice(0, limit).map((name) => {
    const entry = list[name] as { info?: { title?: string; description?: string; version?: string }; preferred?: string; apis?: Record<string, { info?: { version?: string } }> };
    return `${name}\n  ${entry?.info?.title ?? ''}${entry?.preferred ? ` (preferred ${entry.preferred})` : ''}\n  ${(entry?.info?.description ?? '').slice(0, 120)}`;
  });
  return `APIs.guru (${matched.length} total, ${shown.length} shown):\n${shown.join('\n')}`;
}

export async function byName(args: { name?: string }): Promise<string> {
  const name = (args.name ?? '').trim();
  if (!name) throw new ApisGuruError('Provide an API name like "openai.com"');
  const list = await get<Record<string, unknown>>(`${BASE}/list.json`);
  const entry = list[name] as {
    info?: { title?: string; description?: string; version?: string; termsOfService?: string; contact?: { email?: string } };
    preferred?: string;
    versions?: Record<string, { updated?: string; swaggerUrl?: string }>;
  } | undefined;
  if (!entry) throw new ApisGuruError(`API "${name}" not found in the directory`);
  const info = entry.info ?? {};
  return [
    `${info.title ?? name} (v${info.version ?? entry.preferred ?? '?'})`,
    (info.description ?? '').slice(0, 400),
    info.termsOfService ? `Terms: ${info.termsOfService}` : null,
    info.contact?.email ? `Contact: ${info.contact.email}` : null,
    `Preferred version: ${entry.preferred ?? '?'}`,
    entry.versions ? `Versions: ${Object.keys(entry.versions).join(', ')}` : null,
  ].filter(Boolean).join('\n');
}

// ---- muxA tools:

const GURU = "https://api.apis.guru/v2";

function clamp(value: number | undefined, fallback: number, max: number): number {
  return Math.max(1, Math.min(Math.round(value ?? fallback), max));
}

function providerOf(name: string): string {
  const bracket = name.indexOf("[");
  if (bracket > 0) return name.slice(0, bracket);
  const parts = name.split(".");
  if (parts.length >= 2) {
    const tail = parts.slice(-2).join(".");
    return tail.split(":")[0] || name;
  }
  return name;
}

async function guruList(): Promise<Record<string, any>> {
  const res = await fetch(`${GURU}/list.json`, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new ApisGuruError(`APIs.guru returned ${res.status}`);
  return (await res.json()) as Record<string, any>;
}

async function guruSpec(url: string): Promise<any> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(40000),
  });
  if (!res.ok) throw new ApisGuruError(`Spec fetch returned ${res.status}`);
  return (await res.json()) as any;
}

export interface EndpointArgs {
  name: string;
  version?: string;
  search?: string;
  limit?: number;
}

export interface VersionsArgs {
  name: string;
  endpoint_counts?: boolean;
}

export interface StatsArgs {
  group_by?: string;
  limit?: number;
}

export async function apiDirectoryStats(args: StatsArgs): Promise<string> {
  const list = await guruList();
  const names = Object.keys(list);
  if (!names.length) throw new ApisGuruError("APIs.guru returned an empty directory.");
  const limit = clamp(args.limit, 10, 30);
  const groupBy = (args.group_by ?? "provider").trim().toLowerCase();
  if (groupBy === "version_count") {
    const ranked = names
      .map((n) => ({ n, c: Object.keys(list[n]?.versions ?? {}).length }))
      .sort((a, b) => b.c - a.c);
    return [
      `APIs.guru directory: ${names.length} APIs. Most versioned:`,
      ...ranked.slice(0, limit).map((r, i) => `${i + 1}. ${r.n} | ${r.c} version(s)`),
    ].join("\n");
  }
  if (groupBy === "recent") {
    const ranked = names
      .map((n) => ({ n, added: String(list[n]?.added ?? "") }))
      .filter((r) => r.added)
      .sort((a, b) => b.added.localeCompare(a.added));
    return [
      `APIs.guru directory: ${names.length} APIs. Most recently added:`,
      ...ranked.slice(0, limit).map((r, i) => `${i + 1}. ${r.n} | added ${r.added.slice(0, 10)}`),
    ].join("\n");
  }
  if (groupBy !== "provider") {
    return `Unknown group_by "${args.group_by}". Use provider, version_count or recent.`;
  }
  const groups = new Map<string, { count: number; versions: number; sample: string }>();
  for (const n of names) {
    const p = providerOf(n);
    const g = groups.get(p) ?? { count: 0, versions: 0, sample: n };
    g.count += 1;
    g.versions += Object.keys(list[n]?.versions ?? {}).length;
    groups.set(p, g);
  }
  const ranked = [...groups.entries()].sort((a, b) => b[1].count - a[1].count);
  return [
    `APIs.guru directory: ${names.length} APIs across ${ranked.length} providers.`,
    ...ranked.slice(0, limit).map(([k, g], i) => `${i + 1}. ${k} | ${g.count} APIs | ${g.versions} versions | e.g. ${g.sample}`),
  ].join("\n");
}
