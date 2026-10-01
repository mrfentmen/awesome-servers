const BASE = 'https://steamspy.com/api.php';

export interface AppArgs {
  appid: number;
}

export async function app(args: AppArgs): Promise<string> {
  const appid = Math.floor(args.appid ?? 0);
  if (!appid) return 'Provide a Steam app id.';
  const params = new URLSearchParams({ request: 'appdetails', appid: String(appid) });
  const res = await fetch(`${BASE}?${params.toString()}`, {
    headers: { 'User-Agent': 'mrfentmen-steamspy-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`SteamSpy returned ${res.status}`);
  const d = (await res.json()) as Record<string, unknown>;
  const s = (k: string) => (d[k] != null ? String(d[k]) : '');
  if (d.error) return `SteamSpy: ${s('error')}`;
  const genre = (d.genres && Array.isArray(d.genres) ? (d.genres as string[]).join(', ') : s('genre'));
  return [
    `${s('name')}`,
    genre ? `Genres: ${genre}` : '',
    s('owners') ? `Owners: ${s('owners')}` : '',
    s('price') ? `Price: $${Number(s('price')) / 100}` : '',
    s('positive') ? `Positive reviews: ${s('positive')}` : '',
    s('negative') ? `Negative reviews: ${s('negative')}` : '',
  ].filter(Boolean).join('\n') || `No data for app ${appid}.`;
}

// ---- muxB tools:

interface SpyApp {
  appid?: number;
  name?: string;
  developer?: string;
  publisher?: string;
  owners?: string;
  positive?: number;
  negative?: number;
  tags?: Record<string, number> | unknown[];
  price?: string;
}

async function spyGet<T>(params: Record<string, string>): Promise<T> {
  const res = await fetch(`${BASE}?${new URLSearchParams(params).toString()}`, {
    headers: { 'User-Agent': 'mrfentmen-steamspy-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`SteamSpy returned ${res.status}`);
  return (await res.json()) as T
}

function spyLine(app: SpyApp, i: number): string {
  const reviews = app.positive !== undefined && app.negative !== undefined ? `${app.positive} positive / ${app.negative} negative` : 'not reported';
  return `${i + 1}. ${app.name ?? '?'} (appid ${app.appid ?? '?'}) | ${app.developer ?? 'developer not reported'} | owners ${app.owners ?? 'not reported'} | ${reviews}`;
}

export interface GenreAppsArgs {
  genre: string;
  limit?: number;
}

export interface TopOwnedArgs {
  limit?: number;
}

