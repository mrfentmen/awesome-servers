const BASE = 'https://formulae.brew.sh/api/formula';

export interface FormulaArgs {
  name: string;
}

export async function formula(args: FormulaArgs): Promise<string> {
  const name = (args.name ?? '').trim().toLowerCase();
  if (!name) return 'Provide a formula name like git.';
  const res = await fetch(`${BASE}/${encodeURIComponent(name)}.json`, {
    headers: { 'User-Agent': 'mrfentmen-homebrew-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Homebrew returned ${res.status}`);
  const d = (await res.json()) as Record<string, unknown>;
  const str = (k: string) => (d[k] != null ? String(d[k]) : '');
  const dep = (k: string) => {
    const v = d[k];
    if (Array.isArray(v)) return (v as string[]).join(', ');
    if (v && typeof v === 'object') return JSON.stringify(v).slice(0, 200);
    return v != null ? String(v) : '';
  };
  const lines = [
    `${str('name')} ${str('versions') ? `(stable ${(str('versions').match(/"stable":"([^"]*)"/) ?? [])[1] ?? ''})` : ''}`,
    str('desc') ? `Desc: ${str('desc')}` : '',
    str('homepage') ? `Home: ${str('homepage')}` : '',
    dep('dependencies') ? `Deps: ${dep('dependencies')}` : '',
    str('license') ? `License: ${str('license')}` : '',
  ].filter(Boolean);
  return lines.join('\n') || `No data for formula ${name}.`;
}

// ---- muxB tools:

type Cask = {
  token?: string;
  name?: string[];
  version?: string;
  desc?: string | null;
  homepage?: string;
  depends_on?: { macos?: Record<string, string>; cask?: string[] };
  conflicts_with?: { cask?: string[]; formula?: string[] };
  artifacts?: { app?: string[]; binary?: string[] }[];
  caveats?: string | null;
  deprecated?: boolean;
  deprecation_date?: string;
  disabled?: boolean;
  disable_date?: string;
  languages?: string[];
  auto_updates?: boolean;
};

type BottleFile = { cellar?: string; url?: string; sha256?: string };
type Formula = {
  name?: { full?: string; stable?: string; head?: string };
  full_name?: string;
  desc?: string | null;
  homepage?: string;
  versions?: { stable?: string; head?: string; bottle?: boolean };
  revision?: number;
  bottle?: { stable?: { files?: Record<string, BottleFile> } };
  dependencies?: string[];
  build_dependencies?: string[];
  test_dependencies?: string[];
  recommended_dependencies?: string[];
  optional_dependencies?: string[];
  deprecated?: boolean;
  deprecation_date?: string;
  disabled?: boolean;
  disable_date?: string;
  disable_reason?: string;
  keg_only?: boolean;
  aliases?: string[];
  oldname?: string;
};

