const BASE = 'https://www.protondb.com/api/v1/reports/summaries';

export interface SummaryArgs {
  appid: number;
}

export async function summary(args: SummaryArgs): Promise<string> {
  const appid = Math.floor(args.appid ?? 0);
  if (!appid) return 'Provide a Steam app id.';
  const res = await fetch(`${BASE}/${appid}.json`, {
    headers: { 'User-Agent': 'mrfentmen-protondb-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`ProtonDB returned ${res.status}`);
  const d = (await res.json()) as { tier?: string; score?: number; best?: string; confidence?: string; summary?: string };
  return [
    `ProtonDB for app ${appid}:`,
    `Tier: ${d.tier ?? 'unknown'}`,
    d.score != null ? `Score: ${d.score}%` : '',
    d.best ? `Best report: ${d.best}` : '',
    d.confidence ? `Confidence: ${d.confidence}` : '',
    d.summary ? `Summary: ${d.summary}` : '',
  ].filter(Boolean).join('\n');
}

// ---- muxB tools:

export interface GameDetailsArgs {
  appid?: number;
}

export interface FindAppIdArgs {
  query?: string;
  limit?: number;
}

