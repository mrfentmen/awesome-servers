const UA = 'mrfentmen-warframe-mcp/1.0';

export async function state(_args?: unknown): Promise<string> {
  const res = await fetch('https://api.warframestat.us/pc', {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`warframestat.us returned ${res.status}`);
  const d = (await res.json()) as {
    timestamp?: string;
    alerts?: Array<{ mission?: { node?: string; type?: string }; eta?: string }>;
    sortie?: { variant?: Array<{ missionType?: string }> };
    voidTrader?: { character?: string; active?: boolean };
    fissures?: Array<{ node?: string; missionType?: string; tier?: string }>;
  };
  const when = d.timestamp ? new Date(d.timestamp).toISOString() : '?';
  const alerts = (d.alerts ?? []).slice(0, 3).map((a) => `${a.mission?.node ?? '?'} (${a.mission?.type ?? '?'}) ends ${a.eta ?? '?'}`).join('\n');
  const fissures = (d.fissures ?? []).slice(0, 3).map((f) => `${f.tier ?? '?'} ${f.missionType ?? '?'} at ${f.node ?? '?'}`).join('\n');
  return [
    `Warframe state for PC (${when}):`,
    `Alerts (${(d.alerts ?? []).length}):`,
    alerts || '  none',
    `Void trader: ${d.voidTrader?.character ?? 'unknown'} (${d.voidTrader?.active ? 'active' : 'away'})`,
    `Fissures (showing 3):`,
    fissures || '  none',
  ].filter(Boolean).join('\n');
}

// ---- muxB tools:

const NIGHTWAVE_URL = 'https://api.warframestat.us/pc/nightwave?language=en';

async function warframeJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`warframestat.us returned ${res.status}`);
  return (await res.json()) as T;
}

export interface InvasionsArgs {
  limit?: number;
}

export interface NightwaveArgs {
  limit?: number;
}

export async function nightwave(args: NightwaveArgs = {}): Promise<string> {
  const limit = Math.max(1, Math.min(args.limit ?? 5, 20));
  const d = await warframeJson<{
    season?: number;
    tag?: string;
    activation?: string;
    expiry?: string;
    activeChallenges?: Array<{ title?: string; desc?: string; reputation?: number; isElite?: boolean; isPermanent?: boolean; expiry?: string }>;
  }>(NIGHTWAVE_URL);
  const challenges = d.activeChallenges ?? [];
  if (!challenges.length) return `Nightwave season ${d.season ?? '?'} (${d.tag ?? 'not reported'}): no active challenges reported.`;
  return [
    `Nightwave season ${d.season ?? '?'} (${d.tag ?? 'not reported'}), ${d.activation ?? '?'} to ${d.expiry ?? '?'}`,
    `Active challenges (showing ${Math.min(limit, challenges.length)} of ${challenges.length}):`,
    ...challenges
      .slice(0, limit)
      .map((c, i) => `${i + 1}. ${c.title ?? 'untitled'} | ${c.reputation ?? 0} rep | ${c.desc ?? 'no description'}${c.isElite ? ' | elite' : ''}${c.isPermanent ? ' | permanent' : ''}`),
  ].join('\n');
}

// ---- gap4c3 tools:

export async function dailyDeals(args: { limit?: number } = {}): Promise<string> {
  const limit = Math.max(1, Math.min(Math.trunc(args.limit ?? 10), 25));
  const rows = await warframeJson<Array<{ item?: string; originalPrice?: number; salePrice?: number; discount?: number; sold?: number; total?: number; expiry?: string }>>('https://api.warframestat.us/pc/dailyDeals');
  if (!rows.length) return 'No daily deals reported.';
  return `Daily deals (${Math.min(limit, rows.length)} shown):\n` + rows.slice(0, limit).map((r, i) => `${i + 1}. ${r.item ?? 'not reported'} | ${r.salePrice ?? 'not reported'} plat (was ${r.originalPrice ?? 'not reported'}) | ${r.discount ?? 'not reported'}% off | ${r.sold ?? 'not reported'}/${r.total ?? 'not reported'} sold | expires ${r.expiry ?? 'not reported'}`).join('\n');
}
