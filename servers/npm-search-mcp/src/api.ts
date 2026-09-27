const BASE = 'https://registry.npmjs.org';
const UA = 'mrfentmen-npm-search-mcp/1.0 (https://github.com/mrfentmen)';
export class NpmError extends Error {}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new NpmError(`npm registry returned ${res.status}`);
  return (await res.json()) as T;
}

export async function search(args: { query?: string; limit?: number }): Promise<string> {
  const q = (args.query ?? '').trim();
  if (!q) throw new NpmError('Provide a search query');
  const limit = Math.max(1, Math.min(args.limit ?? 10, 25));
  const d = await get<{ objects?: Array<{ package?: { name?: string; version?: string; description?: string; keywords?: string[] }; downloads?: { monthly?: number } }> }>(`${BASE}/-/v1/search?text=${encodeURIComponent(q)}&size=${limit}`);
  const objects = d.objects ?? [];
  if (!objects.length) return `No packages found for "${q}".`;
  return `npm packages matching "${q}" (${objects.length} shown):\n` + objects.map((o, i) => {
    const p = o.package ?? {};
    const dl = o.downloads?.monthly;
    return `${i + 1}. ${p.name ?? '?'}@${p.version ?? '?'}\n   ${p.description ?? ''}\n   ${dl != null ? `${(dl / 1e6).toFixed(1)}M downloads/mo` : ''}${p.keywords?.length ? ` | ${p.keywords.slice(0, 5).join(', ')}` : ''}`;
  }).join('\n');
}

export async function packageInfo(args: { name?: string }): Promise<string> {
  const name = (args.name ?? '').trim();
  if (!name) throw new NpmError('Provide a package name');
  const d = await get<{ name?: string; description?: string; version?: string; license?: string; homepage?: string; repository?: { url?: string }; dist?: { tarball?: string }; time?: Record<string, string>; maintainers?: Array<{ name?: string }> }>(`${BASE}/${encodeURIComponent(name)}`);
  const created = d.time ? Object.keys(d.time)[0] : undefined;
  return [
    `${d.name ?? name}@${d.version ?? '?'}`,
    d.description ?? '',
    `License: ${d.license ?? '?'}`,
    d.homepage ? `Homepage: ${d.homepage}` : null,
    d.repository?.url ? `Repo: ${d.repository.url}` : null,
    created ? `Published: ${created}` : null,
    d.maintainers?.length ? `Maintainers: ${d.maintainers.map((m) => m.name ?? '?').join(', ')}` : null,
  ].filter(Boolean).join('\n');
}

export async function versionInfo(args: { name?: string; version?: string }): Promise<string> {
  const name = (args.name ?? '').trim();
  const version = (args.version ?? '').trim();
  if (!name || !version) throw new NpmError('Provide a package name and version');
  const d = await get<{ version?: string; description?: string; license?: string; dependencies?: Record<string, string>; dist?: { tarball?: string; unpackedSize?: number } }>(`${BASE}/${encodeURIComponent(name)}/${encodeURIComponent(version)}`);
  const deps = d.dependencies ? Object.entries(d.dependencies).slice(0, 10).map(([k, v]) => `${k}@${v}`).join(', ') : '';
  return [
    `${name}@${d.version ?? version}`,
    d.description ?? '',
    `License: ${d.license ?? '?'}`,
    d.dist?.tarball ? `Tarball: ${d.dist.tarball}` : null,
    d.dist?.unpackedSize ? `Unpacked: ${(d.dist.unpackedSize / 1048576).toFixed(1)} MB` : null,
    deps ? `Deps: ${deps}` : null,
  ].filter(Boolean).join('\n');
}

export async function downloadStats(args: { name?: string; period?: string }): Promise<string> {
  const name = (args.name ?? '').trim();
  if (!name) throw new NpmError('Provide a package name');
  const period = (args.period ?? 'last-month').trim() || 'last-month';
  const res = await fetch(`https://api.npmjs.org/downloads/point/${encodeURIComponent(period)}/${encodeURIComponent(name)}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new NpmError(`npm downloads returned ${res.status}`);
  const d = (await res.json()) as { downloads?: number };
  return `${name} downloads (${period}): ${(d.downloads ?? 0).toLocaleString()}`;
}

export async function maintainerSearch(args: { maintainer?: string; limit?: number }): Promise<string> {
  const m = (args.maintainer ?? '').trim();
  if (!m) throw new NpmError('Provide a maintainer username');
  const limit = Math.max(1, Math.min(args.limit ?? 10, 25));
  const d = await get<{ objects?: Array<{ package?: { name?: string; description?: string } }> }>(`${BASE}/-/v1/search?text=maintainer:${encodeURIComponent(m)}&size=${limit}`);
  const objects = d.objects ?? [];
  if (!objects.length) return `No packages maintained by ${m}.`;
  return objects.map((o, i) => `${i + 1}. ${o.package?.name ?? '?'} — ${o.package?.description ?? ''}`).join('\n');
}

export async function npmsScore(args: { name?: string }): Promise<string> {
  const name = (args.name ?? '').trim();
  if (!name) throw new NpmError('Provide a package name');
  const res = await fetch(`https://api.npms.io/v2/package/${encodeURIComponent(name)}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new NpmError(`npms.io returned ${res.status}`);
  const d = (await res.json()) as { score?: { final?: number; detail?: Record<string, number> }; collected?: { metadata?: { dependentsCount?: number } } };
  const det = d.score?.detail ?? {};
  return `${name} npms score: ${d.score?.final != null ? (d.score.final * 100).toFixed(0) : '?'}${d.collected?.metadata?.dependentsCount != null ? ` | dependents ${d.collected.metadata.dependentsCount}` : ''}\nQuality ${det.quality != null ? (det.quality * 100).toFixed(0) : '?'} | Popularity ${det.popularity != null ? (det.popularity * 100).toFixed(0) : '?'} | Maintenance ${det.maintenance != null ? (det.maintenance * 100).toFixed(0) : '?'}`;
}
