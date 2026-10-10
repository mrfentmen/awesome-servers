const BASE = 'https://api.brawlapi.com/v1';

export interface BrawlerArgs {
  name: string;
}

export async function brawlers(): Promise<string> {
  const res = await fetch(`${BASE}/brawlers`, {
    headers: { 'User-Agent': 'mrfentmen-brawl-stars-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`BrawlAPI returned ${res.status}`);
  const d = (await res.json()) as { list?: Array<Record<string, unknown>> };
  const rows = d.list ?? [];
  if (!rows.length) return 'No brawlers returned.';
  return `Brawl Stars brawlers (${rows.length}):\n` +
    rows.slice(0, 30).map((b, i) => {
      const s = (k: string) => (b[k] != null ? String(b[k]) : '');
      const rar = (b.rarity as Record<string, unknown> | undefined)?.name; return `${i + 1}. ${s('name')} | rarity ${String(rar ?? b.rarity ?? '')}`;
    }).join('\n');
}

export async function brawler(args: BrawlerArgs): Promise<string> {
  const name = (args.name ?? '').trim();
  if (!name) return 'Provide a brawler name.';
  const listRes = await fetch(`${BASE}/brawlers`, {
    headers: { 'User-Agent': 'mrfentmen-brawl-stars-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!listRes.ok) throw new Error(`BrawlAPI returned ${listRes.status}`);
  const d = (await listRes.json()) as { list?: Array<Record<string, unknown>> };
  const found = (d.list ?? []).find((b) => String(b.name ?? '').toLowerCase() === name.toLowerCase());
  if (!found) return `No brawler named "${name}".`;
  const s = (k: string) => (found[k] != null ? String(found[k]) : '');
  const sp = (found.starPowers ?? []) as Array<Record<string, unknown>>;
  const ga = (found.gadgets ?? []) as Array<Record<string, unknown>>;
  return [
    `${s('name')} (id ${s('id')})`,
    s('rarity') ? `Rarity: ${s('rarity')}` : '',
    s('class') ? `Class: ${s('class')}` : '',
    s('description') ? `\n${s('description')}` : '',
    sp.length ? `Star powers (${sp.length}): ${sp.slice(0, 3).map((x) => String(x.name ?? '')).join(', ')}` : '',
    ga.length ? `Gadgets (${ga.length}): ${ga.slice(0, 3).map((x) => String(x.name ?? '')).join(', ')}` : '',
  ].filter(Boolean).join('\n');
}

// ---- muxA tools:

export interface MapsArgs {
  mode?: string;
  include_disabled?: boolean;
  limit?: number;
}

export interface ModesArgs {
  include_disabled?: boolean;
  limit?: number;
}

