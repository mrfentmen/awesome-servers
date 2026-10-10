const BASE = 'https://channels.nixos.org/nixpkgs-unstable/packages.json';

export interface SearchArgs {
  query: string;
  limit?: number;
}

let cache: Array<Record<string, unknown>> | null = null;

async function getPackages(): Promise<Array<Record<string, unknown>>> {
  if (cache) return cache;
  const res = await fetch(BASE, {
    headers: { 'User-Agent': 'mrfentmen-nix-packages-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`nixpkgs returned ${res.status}`);
  cache = (await res.json()) as Array<Record<string, unknown>>;
  return cache;
}

export async function search(args: SearchArgs): Promise<string> {
  const q = (args.query ?? '').trim().toLowerCase();
  if (!q) return 'Provide search terms.';
  const limit = Math.max(1, Math.min(args.limit ?? 10, 25));
  const pkgs = await getPackages();
  const matches = pkgs
    .filter((p) => {
      const n = String(p.name ?? '').toLowerCase();
      const a = String(p.attr ?? '').toLowerCase();
      const d = String(p.description ?? '').toLowerCase();
      return n.includes(q) || a.includes(q) || d.includes(q);
    })
    .slice(0, limit);
  if (!matches.length) return `No nixpkgs packages found for "${q}".`;
  return `nixpkgs packages for "${q}" (${matches.length} shown):\n` +
    matches
      .map((r, i) => {
        const s = (k: string) => (r[k] != null ? String(r[k]) : '');
        return `${i + 1}. ${s('attr') || s('name')}${s('description') ? ` | ${s('description').slice(0, 80)}` : ''}`;
      })
      .join('\n');
}

// ---- muxB tools:

// channels.nixos.org's packages.json is gone, but two things it did not serve
// are still published: the nix-releases bucket holds the channel release index,
// and all-packages.nix in the nixpkgs tree is the authoritative attribute set.
const RELEASES_BUCKET = 'https://nix-releases.s3.amazonaws.com'
const ALL_PACKAGES_RAW = 'https://raw.githubusercontent.com/NixOS/nixpkgs/master/pkgs/top-level/all-packages.nix'

interface Release {
  series: string;
  release: string;
  modified: string;
  size: number;
}

let releaseCache: Map<string, Release[]> = new Map();
let attributeCache: Array<{ attr: string; group: string }> | null = null;

async function s3List(params: URLSearchParams, pages: number): Promise<string> {
  const chunks: string[] = [];
  let token = '';
  for (let page = 0; page < pages; page++) {
    const query = new URLSearchParams(params);
    if (token) query.set('continuation-token', token);
    const res = await fetch(`${RELEASES_BUCKET}/?${query.toString()}`, {
      headers: { 'User-Agent': 'mrfentmen-nix-packages-mcp/1.0' },
      signal: AbortSignal.timeout(25000),
    });
    if (!res.ok) throw new Error(`nix-releases bucket returned ${res.status}`);
    const xml = await res.text();
    chunks.push(xml.replace(/^[\s\S]*?<ListBucketResult[^>]*>/, '').replace(/<\/ListBucketResult>[\s\S]*$/, ''));
    const next = /<NextContinuationToken>([^<]+)<\/NextContinuationToken>/.exec(xml);
    if (!/<IsTruncated>true<\/IsTruncated>/.test(xml) || !next) break;
    token = next[1];
  }
  return chunks.join('');
}

// Everything under one channel directory, newest release first. A release
// directory is a key with exactly two path segments under nixpkgs/.
async function getReleases(series: string): Promise<Release[]> {
  const cached = releaseCache.get(series);
  if (cached) return cached;
  const params = new URLSearchParams({ 'list-type': '2', prefix: `nixpkgs/${series}`, 'max-keys': '1000' });
  const xml = await s3List(params, 6);
  const rows: Release[] = [];
  const pattern = /<Key>([^<]+)<\/Key><LastModified>([^<]+)<\/LastModified>.*?<Size>(\d+)<\/Size>/g;
  for (const m of xml.matchAll(pattern)) {
    const parts = m[1].split('/');
    if (parts.length !== 3) continue;
    rows.push({ series: parts[1], release: parts[2], modified: m[2], size: Number(m[3]) });
  }
  rows.sort((a, b) => b.modified.localeCompare(a.modified) || b.release.localeCompare(a.release));
  releaseCache.set(series, rows);
  return rows;
}

async function getAttributes(): Promise<Array<{ attr: string; group: string }>> {
  if (attributeCache) return attributeCache;
  const res = await fetch(ALL_PACKAGES_RAW, {
    headers: { 'User-Agent': 'mrfentmen-nix-packages-mcp/1.0' },
    signal: AbortSignal.timeout(40000),
  });
  if (!res.ok) throw new Error(`raw.githubusercontent.com returned ${res.status}`);
  const text = await res.text();
  const out: Array<{ attr: string; group: string }> = [];
  let group = '(ungrouped)';
  for (const line of text.split('\n')) {
    const head = /^ {2}###\s*(.+?)\.?\s*$/.exec(line);
    if (head) {
      group = head[1];
      continue;
    }
    const attr = /^ {2}([A-Za-z_][A-Za-z0-9_.'-]*)\s*=\s*/.exec(line);
    if (attr) out.push({ attr: attr[1], group });
  }
  if (!out.length) throw new Error('Could not read any top-level attributes out of all-packages.nix.');
  attributeCache = out;
  return out;
}

export interface ListReleasesArgs {
  series?: string;
  limit?: number;
}

export async function listReleases(args: ListReleasesArgs): Promise<string> {
  const series = (args.series ?? '').trim();
  const limit = Math.max(1, Math.min(args.limit ?? 10, 40));
  if (!series) {
    // No filter: the channel directory listing, one level down.
    const xml = await s3List(new URLSearchParams({ 'list-type': '2', prefix: 'nixpkgs/', delimiter: '/', 'max-keys': '1000' }), 3);
    const channels: string[] = [];
    for (const m of xml.matchAll(/<CommonPrefixes><Prefix>nixpkgs\/([^/<]+)\/<\/Prefix><\/CommonPrefixes>/g)) {
      // The delimiter listing mixes channel directories (25.05) with every
      // individual release directory (nixpkgs-25.05pre801581.abc); only the
      // version-shaped names are channels.
      if (/^\d\d(\.\d+)*(-[a-z0-9]+)*$/.test(m[1])) channels.push(m[1]);
    }
    channels.sort((a, b) => b.localeCompare(a));
    if (!channels.length) throw new Error('The nix-releases bucket listed no nixpkgs channel directories.');
    return [
      `nixpkgs channels published in the nix-releases bucket - ${channels.length} channel directories, newest first, showing ${Math.min(limit, channels.length)}:`,
      ...channels.slice(0, limit).map((c, i) => `${i + 1}. nixpkgs/${c}`),
      channels.length > limit ? `...and ${channels.length - limit} older channels, raise limit to see them.` : '',
    ]
      .filter(Boolean)
      .join('\n');
  }
  if (!/^[0-9][0-9A-Za-z.-]*$/.test(series)) throw new Error(`Series must look like 25.05 or 25.05-darwin, got "${series}".`);
  const rows = await getReleases(series);
  if (!rows.length) return `The nix-releases bucket has no releases under nixpkgs/${series}.`;
  return [
    `nixpkgs ${series} channel releases, newest published first - ${rows.length} release directories, showing ${Math.min(limit, rows.length)}:`,
    ...rows.slice(0, limit).map((r, i) => `${i + 1}. [${r.series}] ${r.release}\n   published ${r.modified.slice(0, 10)} · directory entry ${(r.size / 1024).toFixed(1)} KiB`),
    rows.length > limit ? `...and ${rows.length - limit} older releases, raise limit to see them.` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

export interface ListAttributesArgs {
  group?: string;
  limit?: number;
}

