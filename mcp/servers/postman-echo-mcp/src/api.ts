const BASE = 'https://postman-echo.com';

export interface GetArgs {
  params?: string;
}

export async function get(args: GetArgs): Promise<string> {
  const params = (args.params ?? '').trim();
  const url = params ? `${BASE}/get?${params}` : `${BASE}/get`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'mrfentmen-postman-echo-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Postman Echo returned ${res.status}`);
  const d = (await res.json()) as Record<string, unknown>;
  const s = (k: string) => (d[k] != null ? String(d[k]) : '');
  const echoArgs = (d.args ?? {}) as Record<string, unknown>;
  return [
    `GET ${s('url')}`,
    `Args: ${Object.entries(echoArgs).map(([k, v]) => `${k}=${String(v)}`).join(', ') || '(none)'}`,
  ].filter(Boolean).join('\n');
}

export async function ip(_args?: unknown): Promise<string> {
  const res = await fetch(`${BASE}/ip`, {
    headers: { 'User-Agent': 'mrfentmen-postman-echo-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Postman Echo returned ${res.status}`);
  const d = (await res.json()) as Record<string, unknown>;
  return `Outbound IP: ${String(d.ip ?? 'unknown')}`;
}

// ---- muxB tools:
async function echoFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'User-Agent': 'mrfentmen-postman-echo-mcp/1.0', Accept: 'application/json, */*' },
    signal: AbortSignal.timeout(25000),
    ...init,
  })
  if (res.status >= 500) throw new Error(`Postman Echo returned ${res.status}`)
  return res
}

const pickHeaders = (res: Response, names: string[]): string[] =>
  names
    .filter((n) => res.headers.get(n))
    .map((n) => `  ${n}: ${String(res.headers.get(n)).slice(0, 160)}`)

// ---- gap4b2 tools:

