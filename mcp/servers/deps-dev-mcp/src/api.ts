const BASE = 'https://api.deps.dev/v3/systems';

export interface PackageArgs {
  system: string;
  name: string;
  version?: string;
}

export async function info(args: PackageArgs): Promise<string> {
  const system = (args.system ?? '').trim().toLowerCase();
  const name = (args.name ?? '').trim();
  if (!system || !name) return 'Provide an ecosystem (npm, pypi, maven, cargo) and a package name.';
  const version = (args.version ?? '').trim();
  const url = version
    ? `${BASE}/${encodeURIComponent(system)}/packages/${encodeURIComponent(name)}/versions/${encodeURIComponent(version)}`
    : `${BASE}/${encodeURIComponent(system)}/packages/${encodeURIComponent(name)}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'mrfentmen-deps-dev-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`deps.dev returned ${res.status}`);
  const d = (await res.json()) as Record<string, unknown>;
  const s = (k: string) => (d[k] != null ? String(d[k]) : '');
  const str = (k: string) => {
    const v = d[k];
    if (Array.isArray(v)) return (v as unknown[]).slice(0, 10).map((x) => (x && typeof x === 'object' ? JSON.stringify(x).slice(0, 80) : String(x))).join(', ');
    return v != null ? String(v) : '';
  };
  return [
    `${s('name')}${s('version') ? ` ${s('version')}` : ''}`,
    s('description') ? `Desc: ${s('description').slice(0, 120)}` : '',
    s('licenses') ? `Licenses: ${s('licenses')}` : '',
    str('links') ? `Links: ${str('links')}` : '',
  ].filter(Boolean).join('\n') || `No data for ${name}.`;
}

// ---- muxA tools:
// The existing info tool reads the top level fields of whatever deps.dev
// returns, so the new ones read the parts that actually carry the answer: the
// release history of a package, and everything deps.dev knows about one
// version. Both use the same package path the existing tool already uses.
interface VersionEntry {
  versionKey?: { version?: string };
  publishedAt?: string;
  isDefault?: boolean;
  isDeprecated?: boolean;
  deprecatedReason?: string;
}

interface VersionDetail {
  versionKey?: { system?: string; name?: string; version?: string };
  publishedAt?: string;
  isDefault?: boolean;
  isDeprecated?: boolean;
  deprecatedReason?: string;
  licenses?: string[];
  registries?: string[];
  advisoryKeys?: Array<{ id?: string }>;
  attestations?: unknown[];
  slsaProvenances?: unknown[];
  links?: Array<{ label?: string; url?: string }>;
  relatedProjects?: Array<{ projectKey?: { id?: string }; relationType?: string; relationProvenance?: string }>;
}

async function getDeps(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'mrfentmen-deps-dev-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (res.status === 404) throw new Error('deps.dev does not know that package or version.');
  if (!res.ok) throw new Error(`deps.dev returned ${res.status}`);
  return res.json();
}

function packageUrl(system: string, name: string): string {
  const sys = (system ?? '').trim().toLowerCase();
  const pkg = (name ?? '').trim();
  if (!sys || !pkg) throw new Error('Provide an ecosystem (npm, pypi, maven, go, cargo) and a package name.');
  return `${BASE}/${encodeURIComponent(sys)}/packages/${encodeURIComponent(pkg)}`;
}

export async function releaseHistory(args: PackageArgs): Promise<string> {
  const data = (await getDeps(packageUrl(args.system ?? '', args.name ?? ''))) as { versions?: VersionEntry[] };
  const versions = data.versions ?? [];
  if (!versions.length) throw new Error('deps.dev listed no versions for that package.');
  const dated = versions.filter((v) => v.publishedAt).sort((a, b) => String(a.publishedAt).localeCompare(String(b.publishedAt)));
  const deprecated = versions.filter((v) => v.isDeprecated);
  const majors = new Set<string>();
  for (const v of versions) {
    const m = /^(\d+)/.exec(v.versionKey?.version ?? '');
    if (m) majors.add(m[1]);
  }
  const lines = [
    `${(args.name ?? '').trim()} on ${(args.system ?? '').trim().toLowerCase()}`,
    `  versions published: ${versions.length}`,
    `  deprecated: ${deprecated.length}${deprecated.length ? `, for example ${deprecated.slice(0, 3).map((v) => v.versionKey?.version ?? '?').join(', ')}` : ''}`,
    `  distinct major versions: ${majors.size}${majors.size ? `, the newest numbered ${[...majors].sort((a, b) => Number(b) - Number(a))[0]}` : ''}`,
  ];
  if (dated.length) {
    lines.push(`  first release: ${dated[0].publishedAt} (${dated[0].versionKey?.version ?? '?'})`);
    lines.push(`  latest release: ${dated[dated.length - 1].publishedAt} (${dated[dated.length - 1].versionKey?.version ?? '?'})`);
    lines.push('  newest five by publish date:');
    for (const v of dated.slice(-5).reverse()) lines.push(`    ${v.versionKey?.version ?? '?'} on ${v.publishedAt}`);
  } else {
    lines.push('  deps.dev reported no publish dates for these versions.');
  }
  if (dated.length !== versions.length) {
    lines.push(`  ${versions.length - dated.length} version(s) carry no publish date, so they are counted but cannot be placed in time.`);
  }
  lines.push('  the list is every version the registry holds, prerelease and canary builds included.');
  return lines.join('\n');
}

