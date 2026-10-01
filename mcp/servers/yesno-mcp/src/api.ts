const BASE = 'https://yesno.wtf/api';

export async function answer(_args: Record<string, never> = {}): Promise<string> {
  const res = await fetch(BASE, {
    headers: { 'User-Agent': 'mrfentmen-yesno-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`yesno.wtf returned ${res.status}`);
  const data = (await res.json()) as { answer?: string; image?: string };
  if (!data.answer) throw new Error('yesno.wtf returned an empty answer');
  return `${data.answer} ${data.image ?? ''}`.trim();
}

// ---- muxB tools:
const RDAP_ROOT = 'https://rdap.org';
const WIKIDATA = 'https://www.wikidata.org/w/api.php';

function targetHost(raw: string): string {
  const value = (raw ?? '').trim()
  if (!value) throw new Error('Provide a URL or hostname.')
  const stripped = value.replace(/^https?:\/\//, '').replace(/\/.*$/, '')
  if (!/^[a-z0-9.-]+$/i.test(stripped) || !stripped.includes('.')) {
    throw new Error(`"${value}" does not look like a hostname.`)
  }
  return stripped
}

export async function siteUp(args: { url: string }): Promise<string> {
  const host = targetHost(args.url)
  const url = /:\d+$/.test(host) ? `http://${host}/` : `https://${host}/`
  const started = Date.now()
  let status: number
  let statusText: string
  let finalUrl: string
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      headers: { 'User-Agent': 'mrfentmen-yesno-mcp/1.0' },
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
    })
    status = res.status
    statusText = res.statusText
    finalUrl = res.url
  } catch (e) {
    return `No - ${url} could not be reached: ${e instanceof Error ? e.message : String(e)}`
  }
  const ms = Date.now() - started
  const reachable = status > 0 && status < 500
  return [
    reachable ? 'Yes' : 'No',
    `  ${url} answered ${status} ${statusText} in ${ms}ms`,
    `  final URL: ${finalUrl}`,
    `  server: ${reachable ? 'responding' : 'reporting a server error'}`,
  ].join('\n')
}

export async function domainTaken(args: { domain: string }): Promise<string> {
  const host = targetHost(args.domain)
  const res = await fetch(`${RDAP_ROOT}/domain/${encodeURIComponent(host)}`, {
    headers: { Accept: 'application/rdap+json, application/json', 'User-Agent': 'mrfentmen-yesno-mcp/1.0' },
    redirect: 'follow',
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 404) {
    return `No registration record - the registries RDAP reports nothing for ${host}. That is not the same as a guarantee it is free to register, so check with a registrar.`
  }
  if (!res.ok) throw new Error(`RDAP lookup returned ${res.status}`)
  const d = (await res.json()) as { ldhName?: string; handle?: string; status?: string[]; events?: { eventAction?: string; eventDate?: string }[] }
  const event = (a: string) => d.events?.find((e) => e.eventAction === a)?.eventDate?.slice(0, 10) ?? 'not reported'
  return [
    'Yes - already registered',
    `  domain ${d.ldhName ?? host}`,
    `  handle ${d.handle ?? 'not reported'} | registered ${event('registration')} | expires ${event('expiration')}`,
    `  status ${d.status?.length ? d.status.join(', ') : 'not reported'}`,
  ].join('\n')
}

type WdClaim = { mainsnak?: { datavalue?: { value?: { time?: string; id?: string } } } }
type WdEntity = { labels?: Record<string, { value?: string }>; claims?: Record<string, WdClaim[]> }

const timeOf = (claims: WdClaim[] | undefined): string => {
  const time = claims?.[0]?.mainsnak?.datavalue?.value?.time
  return time ? time.replace(/^\+/, '').slice(0, 10) : ''
}

export async function personAlive(args: { name: string }): Promise<string> {
  const name = (args.name ?? '').trim()
  if (!name) throw new Error('Provide a person name to look up.')
  const search = await fetch(`${WIKIDATA}?action=wbsearchentities&format=json&language=en&type=item&limit=5&search=${encodeURIComponent(name)}`, {
    headers: { 'User-Agent': 'mrfentmen-yesno-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  })
  if (!search.ok) throw new Error(`Wikidata search returned ${search.status}`)
  const found = ((await search.json()) as { search?: { id?: string; label?: string; description?: string }[] }).search ?? []
  const hit = found[0]
  if (!hit?.id) throw new Error(`Wikidata has no item matching "${name}".`)
  const detail = await fetch(`${WIKIDATA}?action=wbgetentities&format=json&ids=${encodeURIComponent(hit.id)}&props=labels%7Cclaims`, {
    headers: { 'User-Agent': 'mrfentmen-yesno-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  })
  if (!detail.ok) throw new Error(`Wikidata entity lookup returned ${detail.status}`)
  const entity = ((await detail.json()) as { entities?: Record<string, WdEntity> }).entities?.[hit.id]
  const claims = entity?.claims ?? {}
  const born = timeOf(claims.P569)
  const died = timeOf(claims.P570)
  const today = new Date().toISOString().slice(0, 10)
  const alive = !died
  return [
    alive ? 'Yes - Wikidata records no death date for this person' : 'No - Wikidata records a death date',
    `  ${entity?.labels?.en?.value ?? hit.label ?? name} (${hit.description ?? 'no description'})`,
    `  Wikidata item ${hit.id}`,
    `  born ${born || 'not reported'} | died ${died || 'not reported'}`,
    `  checked against today, ${today}`,
  ].join('\n')
}
