const BASE = 'https://ddragon.leagueoflegends.com/cdn/14.1.1/data/en_US/champion.json';

export interface ChampionsArgs {
  // No arguments needed.
}

export interface ChampionArgs {
  name: string;
}

export async function champions(_args: ChampionsArgs): Promise<string> {
  const res = await fetch(BASE, {
    headers: { 'User-Agent': 'mrfentmen-lol-datadragon-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Data Dragon returned ${res.status}`);
  const d = (await res.json()) as { data?: Record<string, Record<string, unknown>> };
  const champs = Object.values(d.data ?? {});
  if (!champs.length) return 'No champions returned.';
  return `League of Legends champions (${champs.length}):\n` +
    champs
      .map((c, i) => {
        const s = (k: string) => (c[k] != null ? String(c[k]) : '');
        const tags = Array.isArray(c.tags) ? (c.tags as string[]).join(', ') : '';
        return `${i + 1}. ${s('name')} ${s('title') ? `| ${s('title')}` : ''}${tags ? ` [${tags}]` : ''}`;
      })
      .join('\n');
}

export async function champion(args: ChampionArgs): Promise<string> {
  const name = (args.name ?? '').trim();
  if (!name) return 'Provide a champion name.';
  const res = await fetch(BASE, {
    headers: { 'User-Agent': 'mrfentmen-lol-datadragon-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Data Dragon returned ${res.status}`);
  const d = (await res.json()) as { data?: Record<string, Record<string, unknown>> };
  const c = Object.values(d.data ?? {}).find((ch) => String(ch.name ?? '').toLowerCase() === name.toLowerCase());
  if (!c) return `Champion ${name} not found.`;
  const s = (k: string) => (c[k] != null ? String(c[k]) : '');
  const stats = (c.stats && typeof c.stats === 'object' ? c.stats as Record<string, unknown> : {});
  const ss = (k: string) => (stats[k] != null ? String(stats[k]) : '');
  return [
    `${s('name')} ${s('title') ? `| ${s('title')}` : ''}`,
    s('blurb') ? `\n${s('blurb')}` : '',
    ss('hp') ? `HP ${ss('hp')} | AD ${ss('attackdamage')} | MS ${ss('movespeed')}` : '',
    s('partype') ? `Resource: ${s('partype')}` : '',
  ].filter(Boolean).join('\n');
}

// ---- muxB tools:

export interface ItemsArgs {
  name?: string;
  limit?: number;
}

export interface RunesArgs {
  tree?: string;
}

