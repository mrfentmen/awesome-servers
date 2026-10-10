const BASE = 'https://data.iana.org/TLD/tlds-alpha-by-domain.txt';

export interface ListArgs {
  search?: string;
  limit?: number;
}

async function allTlds(): Promise<string[]> {
  const res = await fetch(BASE, {
    headers: { 'User-Agent': 'mrfentmen-iana-tld-mcp/1.0' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`IANA tld list returned ${res.status}`);
  const text = await res.text();
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => l.toLowerCase());
}

export async function list(args: ListArgs = {}): Promise<string> {
  const q = (args.search ?? '').trim().toLowerCase();
  const limit = Math.max(1, Math.min(args.limit ?? 100, 1500));
  const all = await allTlds();
  const filtered = q ? all.filter((t) => t.includes(q)) : all;
  const shown = filtered.slice(0, limit);
  if (!shown.length) return `No top level domains match "${q}".`;
  return `Top level domains (${shown.length} shown):\n` + shown.map((t, i) => `${i + 1}. .${t}`).join('\n');
}

// ---- muxC tools:

/**
 * The IANA RDAP bootstrap file is the authoritative map from a TLD to the RDAP
 * servers that answer registration queries for it, which is what you need
 * before you can look anything up for that TLD.
 */
interface IanaRdapServices {
  publication?: string
  description?: string
  services?: Array<[string[], string[]]>
}

