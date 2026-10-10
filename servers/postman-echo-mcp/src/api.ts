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

export async function statusProbe(args: { code: number }) {
  const code = Math.max(100, Math.min(Math.trunc(Number(args.code ?? 200)), 599))
  const res = await echoFetch(`/status/${code}`)
  const body = (await res.text()).replace(/\s+/g, ' ').trim().slice(0, 200)
  return [
    `Asked Postman Echo for HTTP ${code}`,
    `  it answered ${res.status} ${res.statusText}`,
    `  body: ${body || '(empty)'}`,
    `  matched what was asked: ${res.status === code ? 'yes' : `no, it answered ${res.status}`}`,
    ...pickHeaders(res, ['content-type', 'content-length', 'cache-control']),
  ].join('\n')
}

export async function headerEcho(args: { headers?: string }) {
  const raw = (args.headers ?? '').trim()
  if (!raw) throw new Error('Provide headers as name=value pairs joined by &, for example x-trace=abc&x-run=42')
  const pairs = raw
    .split('&')
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, 12)
  const names: string[] = []
  for (const pair of pairs) {
    if (!pair.includes('=')) throw new Error(`"${pair}" is not a name=value pair.`)
    const name = pair.slice(0, pair.indexOf('='))
    if (!/^[A-Za-z0-9!#$%&'*+.^_`|~-]+$/.test(name)) throw new Error(`"${name}" is not a valid header name.`)
    names.push(name)
  }
  const res = await echoFetch(`/response-headers?${pairs.map((p) => p.replace(/^([^=]+)=/, (m, n) => `${encodeURIComponent(n)}=`)).join('&')}`)
  const echoed = (await res.json()) as Record<string, unknown>
  const rows = pairs.map((p) => {
    const name = p.slice(0, p.indexOf('='))
    const sent = p.slice(p.indexOf('=') + 1)
    const got = echoed[name]
    return `- ${name}: sent "${sent.slice(0, 80)}" | echoed back ${got != null ? `"${String(got).slice(0, 80)}"` : 'not present'}`
  })
  const missing = names.filter((n) => echoed[n] === undefined)
  return [
    `Header round trip through Postman Echo (${pairs.length} header(s))`,
    `  all echoed correctly: ${missing.length === 0 ? 'yes' : `no, missing ${missing.join(', ')}`}`,
    ...rows,
  ].join('\n')
}

export async function redirectProbe(args: { url: string; status_code?: number }) {
  const target = (args.url ?? '').trim()
  if (!/^https?:\/\/.+/i.test(target)) throw new Error('Provide a full http or https URL to redirect to.')
  const wanted = Math.max(300, Math.min(Math.trunc(Number(args.status_code ?? 302)), 399))
  const qs = `url=${encodeURIComponent(target)}&status_code=${wanted}`
  const res = await echoFetch(`/redirect-to?${qs}`, { redirect: 'manual' })
  const location = res.headers.get('location')
  return [
    `Redirect probe against Postman Echo`,
    `  asked for ${wanted} to ${target}`,
    `  got ${res.status} ${res.statusText}`,
    `  Location: ${location ?? 'no Location header returned'}`,
    `  honoured the requested code: ${res.status === wanted ? 'yes' : `no, it answered ${res.status}`}`,
    ...pickHeaders(res, ['content-type', 'content-length']),
  ].join('\n')
}
