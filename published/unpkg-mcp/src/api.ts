const BASE = 'https://unpkg.com';

export interface PackageArgs {
  name: string;
  version?: string;
}

export async function info(args: PackageArgs): Promise<string> {
  const name = (args.name ?? '').trim();
  if (!name) return 'Provide a package name.';
  const version = (args.version ?? '').trim();
  const url = version ? `${BASE}/${encodeURIComponent(name)}@${encodeURIComponent(version)}/package.json` : `${BASE}/${encodeURIComponent(name)}/package.json`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'mrfentmen-unpkg-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`unpkg returned ${res.status}`);
  const d = (await res.json()) as Record<string, unknown>;
  const s = (k: string) => (d[k] != null ? String(d[k]) : '');
  const deps = (d.dependencies && typeof d.dependencies === 'object' ? Object.keys(d.dependencies as Record<string, unknown>).slice(0, 10).join(', ') : '');
  return [
    `${s('name')}${s('version') ? ` ${s('version')}` : ''}`,
    s('description') ? `Desc: ${s('description').slice(0, 120)}` : '',
    s('license') ? `License: ${s('license')}` : '',
    deps ? `Deps: ${deps}` : '',
    s('repository') ? `Repo: ${s('repository').slice(0, 100)}` : '',
  ].filter(Boolean).join('\n') || `No data for ${name}.`;
}

// ---- muxB tools:

interface UnpkgFile {
  path?: string;
  size?: number;
  type?: string;
  integrity?: string;
}

interface UnpkgMeta {
  package?: string;
  version?: string;
  prefix?: string;
  files?: UnpkgFile[];
}

export interface FilesArgs {
  name: string;
  version?: string;
  path?: string;
  limit?: number;
}

export interface ReadFileArgs {
  name: string;
  path: string;
  version?: string;
  max_bytes?: number;
}

