const BASE = 'https://www.disify.com/api';
const UA = 'mrfentmen-disify-mcp/1.0';

export interface CheckArgs {
  email: string;
}

export interface DomainArgs {
  domain: string;
}

export interface BulkArgs {
  emails: string[];
}

interface DisifyResult {
  format?: boolean;
  domain?: string;
  disposable?: boolean;
  dns?: boolean;
  free?: boolean;
  role?: boolean;
  whitelist?: boolean;
  confidence?: number;
  mx_info?: string[];
  domain_info?: { tld?: string; is_subdomain?: boolean; parent_domain?: string | null };
}

async function lookup(path: string): Promise<DisifyResult> {
  const res = await fetch(`${BASE}/${path}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Disify returned ${res.status}`);
  return (await res.json()) as DisifyResult;
}

const yesNo = (value: unknown) =>
  value === true ? 'yes' : value === false ? 'no' : 'unknown';

export async function check(args: CheckArgs): Promise<string> {
  const email = (args.email ?? '').trim().toLowerCase();
  if (!email || !email.includes('@')) return 'Provide a valid email address.';
  const d = await lookup(`email/${encodeURIComponent(email)}`);
  const s = (k: keyof DisifyResult) => (d[k] != null ? String(d[k]) : '');
  return [
    `Email: ${email}`,
    `Format valid: ${s('format')}`,
    `Disposable: ${s('disposable')}`,
    `DNS records: ${s('dns')}`,
    d.disposable === true ? 'Warning: this is a disposable email address.' : '',
  ].filter(Boolean).join('\n');
}

export async function checkDomain(args: DomainArgs): Promise<string> {
  const domain = (args.domain ?? '').trim().toLowerCase();
  if (!domain || !domain.includes('.')) return 'Provide a domain like example.com.';
  const d = await lookup(`domain/${encodeURIComponent(domain)}`);
  return [
    `Domain: ${domain}`,
    `Disposable: ${yesNo(d.disposable)}`,
    `Free provider: ${yesNo(d.free)}`,
    `Has DNS records: ${yesNo(d.dns)}`,
    `Whitelisted: ${yesNo(d.whitelist)}`,
    `TLD: ${d.domain_info?.tld ?? 'unknown'}`,
    d.mx_info?.length ? `MX hosts: ${d.mx_info.length}` : '',
    d.disposable === true ? 'Warning: this is a disposable email domain.' : '',
  ].filter(Boolean).join('\n');
}

export async function checkBulk(args: BulkArgs): Promise<string> {
  const emails = (args.emails ?? [])
    .map((value) => String(value).trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 10);
  if (!emails.length) return 'Provide up to 10 email addresses to check.';
  const rows: string[] = [];
  let disposable = 0;
  for (const email of emails) {
    if (!email.includes('@')) {
      rows.push(`${email} - invalid, no @ symbol`);
      continue;
    }
    const d = await lookup(`email/${encodeURIComponent(email)}`);
    if (d.disposable === true) disposable += 1;
    rows.push(`${email} - format: ${yesNo(d.format)} | disposable: ${yesNo(d.disposable)} | dns: ${yesNo(d.dns)} | role: ${yesNo(d.role)}`);
  }
  return `Checked ${emails.length} address(es), ${disposable} disposable:\n` + rows.join('\n');
}

export async function mxRecords(args: DomainArgs): Promise<string> {
  const domain = (args.domain ?? '').trim().toLowerCase();
  if (!domain || !domain.includes('.')) return 'Provide a domain like example.com.';
  const d = await lookup(`domain/${encodeURIComponent(domain)}`);
  const hosts = d.mx_info ?? [];
  if (!hosts.length) return `Disify returned no MX hosts for ${domain}.`;
  return `MX hosts for ${domain} (${hosts.length}):\n` +
    hosts.map((host, i) => `${i + 1}. ${host}`).join('\n');
}

// DNS is resolved through Cloudflare's public DNS-over-HTTPS endpoint, which needs
// no account, so the server can answer DNS questions without any credential.
const DOH = 'https://cloudflare-dns.com/dns-query';

const RECORD_TYPES = ['A', 'AAAA', 'MX', 'NS', 'TXT', 'CNAME', 'SOA', 'CAA', 'PTR', 'SRV'] as const;

/** RFC 1035 record numbers that the DoH JSON response reports. */
const TYPE_NAMES: Record<number, string> = {
  1: 'A', 2: 'NS', 5: 'CNAME', 6: 'SOA', 12: 'PTR', 15: 'MX', 16: 'TXT',
  28: 'AAAA', 33: 'SRV', 257: 'CAA',
};

interface DohAnswer {
  name?: string;
  type?: number;
  TTL?: number;
  data?: string;
}

interface DohResponse {
  Status?: number;
  Answer?: DohAnswer[];
  Authority?: DohAnswer[];
}

const RCODE: Record<number, string> = {
  0: 'NOERROR',
  1: 'FORMERR',
  2: 'SERVFAIL',
  3: 'NXDOMAIN',
  5: 'REFUSED',
};

async function dnsQuery(domain: string, type: string): Promise<DohResponse> {
  const url = `${DOH}?name=${encodeURIComponent(domain)}&type=${encodeURIComponent(type)}`
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'application/dns-json' },
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new Error(`DNS-over-HTTPS returned ${res.status}`)
  return (await res.json()) as DohResponse
}

const answerLines = (d: DohResponse): string[] =>
  (d.Answer ?? []).map((row) => {
    const kind = TYPE_NAMES[row.type ?? 0] ?? `TYPE${row.type ?? '?'}`
    const ttl = row.TTL != null ? ` (TTL ${row.TTL})` : ''
    return `${kind}: ${String(row.data ?? '').trim()}${ttl}`
  })

export interface DnsArgs {
  domain: string
  type?: string
}

export async function dnsLookup(args: DnsArgs): Promise<string> {
  const domain = (args.domain ?? '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
  if (!domain || !domain.includes('.')) return 'Provide a domain like example.com.'
  const requested = (args.type ?? 'A').trim().toUpperCase()
  if (!RECORD_TYPES.includes(requested as (typeof RECORD_TYPES)[number])) {
    return `Unsupported record type "${requested}". Use one of: ${RECORD_TYPES.join(', ')}.`
  }
  const data = await dnsQuery(domain, requested)
  const code = data.Status ?? 0
  const lines = answerLines(data)
  if (!lines.length) {
    return `${domain} has no ${requested} records (DNS status ${RCODE[code] ?? code}).`
  }
  return `${requested} records for ${domain} (DNS status ${RCODE[code] ?? code}, ${lines.length} answer(s)):\n` +
    lines.map((line, i) => `${i + 1}. ${line}`).join('\n')
}

export interface SummaryArgs {
  domain: string
}

/** One call that combines the Disify domain verdict with live DNS resolution. */
export async function domainSummary(args: SummaryArgs): Promise<string> {
  const domain = (args.domain ?? '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
  if (!domain || !domain.includes('.')) return 'Provide a domain like example.com.'

  const d = await lookup(`domain/${encodeURIComponent(domain)}`)
  const wanted = ['A', 'NS', 'MX'] as const
  const results = await Promise.allSettled(wanted.map((type) => dnsQuery(domain, type)))

  const dns: string[] = []
  results.forEach((result, i) => {
    const type = wanted[i]
    if (result.status === 'fulfilled') {
      const lines = answerLines(result.value)
      // Each answer line already carries its record type, so do not repeat it.
      dns.push(lines.length ? lines.join(' | ') : `${type}: none (DNS status ${RCODE[result.value.Status ?? 0] ?? result.value.Status})`)
    } else {
      dns.push(`${type}: lookup failed (${result.reason instanceof Error ? result.reason.message : String(result.reason)})`)
    }
  })

  const verdict = d.disposable === true
    ? 'DISPOSABLE — do not accept for signup'
    : d.dns === false
      ? 'No DNS records, so mail will not deliver'
      : 'Not disposable'

  return [
    `Domain summary for ${domain}`,
    `Verdict: ${verdict}`,
    `Disposable: ${yesNo(d.disposable)} | Free provider: ${yesNo(d.free)} | Whitelisted: ${yesNo(d.whitelist)} | Has DNS: ${yesNo(d.dns)}`,
    `TLD: ${d.domain_info?.tld ?? 'unknown'}${d.domain_info?.is_subdomain ? ` | subdomain of ${d.domain_info.parent_domain ?? '?'}` : ''}`,
    `Role address domain hints: ${d.role == null ? 'unknown' : yesNo(d.role)}`,
    '',
    `Live DNS (Cloudflare):`,
    ...dns.map((line) => `  ${line}`),
    d.mx_info?.length ? `  Disify MX hosts: ${d.mx_info.join(', ')}` : '',
    '',
    'Sources: disify.com for the disposable verdict, Cloudflare DNS-over-HTTPS for the records.',
  ]
    .filter((line) => line !== '' || true)
    .join('\n')
}

// ---- batch-2 tools: extra live-data tools (2026-09-26) ----
// The batch-2 checks below all resolve through the Cloudflare resolver above, but
// ask for DNSSEC records, which only come back when the DO bit is set.

interface SecureDohResponse extends DohResponse {
  AD?: boolean
}

const cleanDomain = (value: string) =>
  String(value ?? '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')

async function dnsQuerySecure(domain: string, type: string): Promise<SecureDohResponse> {
  const url = `${DOH}?name=${encodeURIComponent(domain)}&type=${encodeURIComponent(type)}&do=true`
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'application/dns-json' },
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new Error(`DNS-over-HTTPS returned ${res.status}`)
  return (await res.json()) as SecureDohResponse
}

/** RFC 8624 signing algorithms, by their assigned number. */
const DNSSEC_ALGORITHMS: Record<number, string> = {
  5: 'RSASHA1',
  7: 'RSASHA1-NSEC3',
  8: 'RSASHA256',
  10: 'RSASHA512',
  13: 'ECDSAP256SHA256',
  14: 'ECDSAP384SHA384',
  15: 'ED25519',
  16: 'ED448',
}

export interface DnssecArgs {
  domain: string
}

/** DNSSEC posture for a zone: the resolver's validated (AD) flag, DNSKEY and DS. */
export async function dnssecCheck(args: DnssecArgs): Promise<string> {
  const domain = cleanDomain(args?.domain)
  if (!domain || !domain.includes('.')) return 'Provide a domain like example.com.'
  const [keyResult, dsResult] = await Promise.allSettled([
    dnsQuerySecure(domain, 'DNSKEY'),
    dnsQuerySecure(domain, 'DS'),
  ])
  if (keyResult.status === 'rejected' && dsResult.status === 'rejected') {
    const reason = keyResult.reason instanceof Error ? keyResult.reason.message : String(keyResult.reason)
    throw new Error(`Could not read DNSSEC records for ${domain}: ${reason}`)
  }
  const keyRows = keyResult.status === 'fulfilled' ? keyResult.value.Answer ?? [] : []
  const dsRows = dsResult.status === 'fulfilled' ? dsResult.value.Answer ?? [] : []
  const dnskey = keyRows.filter((row) => row.type === 48)
  const rrsig = keyRows.filter((row) => row.type === 46)
  const ds = dsRows.filter((row) => row.type === 43)
  const ad = keyResult.status === 'fulfilled' && keyResult.value.AD === true
  const status = keyResult.status === 'fulfilled' ? RCODE[keyResult.value.Status ?? 0] ?? String(keyResult.value.Status) : 'lookup failed'

  const algorithms = [
    ...new Set(
      dnskey
        .map((row) => {
          const match = /^\d+\s+\d+\s+(\d+)/.exec(String(row.data ?? ''))
          if (!match) return null
          const number = Number(match[1])
          return DNSSEC_ALGORITHMS[number] ?? `algorithm ${number}`
        })
        .filter((value): value is string => value != null)
    ),
  ]
  const flags = dnskey.map((row) => {
    const match = /^(\d+)/.exec(String(row.data ?? ''))
    const value = match ? Number(match[1]) : 0
    return value === 257 ? 'KSK' : value === 256 ? 'ZSK' : `flags ${value}`
  })

  const verdict = ad
    ? 'Signed and validated — the resolver confirmed the DNSSEC signatures.'
    : dnskey.length
      ? 'Signed but NOT validated — the zone publishes DNSKEY records, yet the resolver did not set the AD flag. Check the parent DS record.'
      : 'Not signed — no DNSKEY at the zone apex, so DNS answers cannot be authenticated.'
  const lines = [
    `DNSSEC for ${domain} (zone apex):`,
    `Verdict: ${verdict}`,
    `Validated (AD flag): ${ad ? 'yes' : 'no'} | DNS status: ${status}`,
    `DNSKEY records: ${dnskey.length}${flags.length ? ` (${flags.join(', ')})` : ''}`,
    `Algorithms: ${algorithms.join(', ') || 'none published'}`,
    `Parent DS records: ${ds.length ? ds.map((row) => String(row.data ?? '').split(' ').slice(0, 3).join(' ')).join(' | ') : 'none visible from this resolver'}`,
    `RRSIG signatures in the answer: ${rrsig.length}`,
    '',
    ad
      ? 'Queries for this zone can be authenticated, which is what mail receivers and browsers prefer.'
      : 'Unsigned or unvalidated zones still resolve normally; the answers just cannot be proven authentic.',
  ]
  return lines.join('\n')
}

const txtValues = (rows: DohAnswer[]): string[] =>
  rows
    .filter((row) => row.type === 16)
    .map((row) => String(row.data ?? '').replace(/^"|"$/g, '').replace(/\\"/g, '"'))

/** Selectors worth trying when a domain does not document its DKIM setup. */
const DKIM_SELECTORS = ['default', 'google', 'selector1', 'selector2', 'k1', 's1', 's2', 'mail', 'dkim', 'smtp']

export interface EmailAuthArgs {
  domain: string
}

/** SPF, DMARC, DKIM and MX for a domain: whether its mail can be authenticated. */
export async function emailAuth(args: EmailAuthArgs): Promise<string> {
  const domain = cleanDomain(args?.domain)
  if (!domain || !domain.includes('.')) return 'Provide a domain like example.com.'
  const lookups = await Promise.allSettled([
    dnsQuery(domain, 'TXT'),
    dnsQuery(`_dmarc.${domain}`, 'TXT'),
    dnsQuery(domain, 'MX'),
    ...DKIM_SELECTORS.map((selector) => dnsQuery(`${selector}._domainkey.${domain}`, 'TXT')),
  ])

  const settled = <T>(result: PromiseSettledResult<T>, fallback: T): T =>
    result.status === 'fulfilled' ? result.value : fallback
  const rootTxt = txtValues(settled(lookups[0] as PromiseSettledResult<DohResponse>, { Answer: [] }).Answer ?? [])
  const dmarcTxt = txtValues(settled(lookups[1] as PromiseSettledResult<DohResponse>, { Answer: [] }).Answer ?? [])
  const mxRows = settled(lookups[2] as PromiseSettledResult<DohResponse>, { Answer: [] }).Answer ?? []

  const spf = rootTxt.find((value) => value.toLowerCase().startsWith('v=spf1'))
  const dmarc = dmarcTxt.find((value) => value.toLowerCase().startsWith('v=dmarc1'))
  const dkim: Array<{ selector: string; value: string }> = []
  DKIM_SELECTORS.forEach((selector, index) => {
    const result = lookups[3 + index] as PromiseSettledResult<DohResponse> | undefined
    if (!result || result.status !== 'fulfilled') return
    const value = txtValues(result.value.Answer ?? []).find(
      (entry) => entry.toLowerCase().includes('v=dkim1') || entry.toLowerCase().includes('p=')
    )
    if (value) dkim.push({ selector, value })
  })

  const allQualifier = spf ? /([-~?+])all\b/.exec(spf)?.[1] : undefined
  const spfPolicy =
    allQualifier === '-'
      ? 'strict: only the listed senders may send'
      : allQualifier === '~'
        ? 'soft fail: other senders are marked but still delivered'
        : allQualifier === '?'
          ? 'neutral: SPF claims nothing about other senders'
          : allQualifier === '+'
            ? 'permissive: every sender passes (+all)'
            : 'no all-qualifier, so unauthorised senders are not rejected'
  const dmarcPolicy = dmarc ? /(?:^|;)\s*p\s*=\s*([a-z]+)/i.exec(dmarc)?.[1]?.toLowerCase() : undefined
  const rua = dmarc ? /(?:^|;)\s*rua\s*=\s*([^;]+)/i.exec(dmarc)?.[1]?.trim() : undefined
  const mxHosts = mxRows.filter((row) => row.type === 15).map((row) => String(row.data ?? ''))
  const verdict =
    spf && dmarc
      ? `SPF and DMARC are published${dmarcPolicy ? ` (p=${dmarcPolicy})` : ''}; spoofed mail can be filtered.`
      : !spf && !dmarc
        ? 'No SPF and no DMARC record, so anyone can spoof this domain in mail.'
        : spf
          ? 'SPF is published but DMARC is missing, so receivers have no instruction for failing mail.'
          : 'DMARC is published but SPF is missing, which weakens the policy it asks receivers to enforce.'

  return [
    `Mail authentication for ${domain}:`,
    `Verdict: ${verdict}`,
    `SPF: ${spf ? spf : 'not published'}${spf ? `\n  Policy: ${spfPolicy}` : ''}`,
    `DMARC: ${dmarc ? dmarc : 'not published'}` +
      (dmarc ? `\n  Enforcement: ${dmarcPolicy ?? 'none stated'}${rua ? ` | reports to ${rua}` : ''}` : ''),
    `DKIM: ${dkim.length ? dkim.map((entry) => entry.selector).join(', ') : `no key found at the ${DKIM_SELECTORS.length} common selectors`}` +
      (dkim.length ? `\n  First key: ${dkim[0].value.slice(0, 120)}${dkim[0].value.length > 120 ? '…' : ''}` : ''),
    `MX hosts: ${mxHosts.length ? mxHosts.join(' | ') : 'none — the domain cannot receive mail'}`,
    '',
    `Checked through Cloudflare DNS-over-HTTPS. DKIM selectors tried: ${DKIM_SELECTORS.join(', ')}.`,
  ].join('\n')
}

export interface LookalikeArgs {
  domain: string
  limit?: number
}

/** Keyboard-neighbour and homoglyph swaps used to spot lookalike domains. */
const HOMOGLYPHS: Record<string, string[]> = {
  a: ['4'],
  b: ['6'],
  e: ['3'],
  g: ['9'],
  i: ['1'],
  l: ['1'],
  m: ['rn'],
  n: ['m'],
  o: ['0'],
  s: ['5'],
  t: ['7'],
  u: ['v'],
  v: ['u'],
}

const LOOKALIKE_TLDS = ['com', 'net', 'org', 'co', 'io']

/** Mix of typos, homoglyphs and common TLD swaps for one domain. */
function lookalikeCandidates(domain: string): string[] {
  const [bare, ...rest] = domain.split('.')
  const tld = rest.join('.') || 'com'
  const chars = bare.split('')
  const names = new Set<string>()
  for (let i = 0; i < chars.length; i += 1) {
    if (i + 1 < chars.length && chars[i] !== chars[i + 1]) {
      const swapped = [...chars]
      const left = swapped[i]
      swapped[i] = swapped[i + 1]
      swapped[i + 1] = left
      names.add(swapped.join(''))
    }
    names.add(chars.slice(0, i + 1).join('') + chars[i] + chars.slice(i + 1).join(''))
    if (chars.length > 3) {
      names.add(chars.slice(0, i).join('') + chars.slice(i + 1).join(''))
    }
    for (const swap of HOMOGLYPHS[chars[i]] ?? []) {
      names.add(chars.slice(0, i).join('') + swap + chars.slice(i + 1).join(''))
    }
  }
  const candidates = [...names]
    .filter((name) => name && name !== bare)
    .slice(0, 18)
    .map((name) => `${name}.${tld}`)
  for (const alternative of LOOKALIKE_TLDS) {
    if (alternative !== tld) candidates.push(`${bare}.${alternative}`)
  }
  return [...new Set(candidates)]
}

/** Resolves typo and homoglyph variants of a domain to find live lookalikes. */
export async function lookalikeDomains(args: LookalikeArgs): Promise<string> {
  const domain = cleanDomain(args?.domain)
  if (!domain || !domain.includes('.')) return 'Provide a domain like example.com.'
  const limit = Math.min(Math.max(Number(args?.limit ?? 10) || 10, 1), 25)
  const candidates = lookalikeCandidates(domain)
  const live: Array<{ host: string; addresses: string[] }> = []
  // Small batches keep the whole check inside one tool-call budget.
  for (let i = 0; i < candidates.length; i += 6) {
    const batch = candidates.slice(i, i + 6)
    const settled = await Promise.allSettled(batch.map((host) => dnsQuery(host, 'A')))
    settled.forEach((result, index) => {
      if (result.status !== 'fulfilled') return
      const addresses = (result.value.Answer ?? [])
        .filter((row) => row.type === 1)
        .map((row) => String(row.data ?? ''))
      if (addresses.length) live.push({ host: batch[index], addresses })
    })
  }
  const header = `Lookalike check for ${domain}: ${candidates.length} variant(s) checked, ${live.length} live.`
  if (!live.length) {
    return `${header}\nNone of the tested typos, homoglyphs or alternative TLDs currently resolve.\n` +
      'This is a spot check of a fixed variant list, not an exhaustive brand watch.'
  }
  return `${header}\nLive lookalike domains (${Math.min(limit, live.length)} of ${live.length} shown):\n` +
    live.slice(0, limit).map((entry, i) =>
      `${i + 1}. ${entry.host} -> ${entry.addresses.join(', ')}\n   resolves, so the name is registered and answering`
    ).join('\n') +
    `\n\nWorth checking which of these you own or monitor. Some may be parked or defensive registrations.`
}

// ---- muxD tools:

/* ------------------------------------------------------------------ *
 * 1. Registration data over RDAP, which is a different data source
 *    from the Disify checks and DNS lookups this file already does.
 * ------------------------------------------------------------------ */

const RDAP_BOOTSTRAP = 'https://rdap.org/domain/'

interface RdapEvent { eventAction?: string; eventDate?: string }
interface RdapEntity { roles?: string[]; vcardArray?: unknown[]; publicIds?: Array<{ identifier?: string; type?: string }> }

/** Pull a human name out of an RDAP vCard, which is how the registrar is labelled. */
function rdapName(entity: RdapEntity): string {
  const card = entity?.vcardArray
  if (Array.isArray(card) && Array.isArray(card[1])) {
    for (const entry of card[1] as unknown[][]) {
      if (entry[0] === 'fn' && entry[3]) return String(entry[3])
    }
  }
  return ''
}

export interface RegistrationArgs {
  domain: string;
}

/* ------------------------------------------------------------------ *
 * 2. Typosquatting and homoglyph detection on a concrete address.
 * ------------------------------------------------------------------ */

// Characters people and scripts confuse constantly, mapped to what the
// reader probably meant.
const CONFUSABLES: Record<string, string> = {
  '0': 'o', '1': 'l', '3': 'e', '5': 's', '7': 't', '8': 'b', '4': 'a', '6': 'g',
  'vv': 'w', 'rn': 'm', 'cl': 'd', 'ii': 'n', 'l': 'i',
}

// Free mail providers whose addresses are worth impersonating, so a one-character
// deviation from one of these is worth reporting.
const TARGET_BRANDS = [
  'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.co.uk', 'hotmail.com', 'outlook.com',
  'live.com', 'msn.com', 'aol.com', 'icloud.com', 'me.com', 'mac.com', 'protonmail.com', 'proton.me',
  'gmx.com', 'gmx.de', 'mail.com', 'yandex.ru', 'zoho.com', 'fastmail.com', 'hey.com', 'tutanota.com',
]

const LEET_UNMAP: Record<string, string> = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '8': 'b', '@': 'a', '$': 's', '!': 'i', '|': 'i' }

/** How many single-character edits apart two strings are, with early exit. */
function editDistance(a: string, b: string, cap = 3): number {
  if (Math.abs(a.length - b.length) > cap) return cap + 1
  const prev = new Array<number>(b.length + 1)
  for (let j = 0; j <= b.length; j += 1) prev[j] = j
  for (let i = 1; i <= a.length; i += 1) {
    let last = prev[0]
    prev[0] = i
    for (let j = 1; j <= b.length; j += 1) {
      const tmp = prev[j]
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, last + (a[i - 1] === b[j - 1] ? 0 : 1))
      last = tmp
    }
  }
  return prev[b.length]
}

export interface TypoArgs {
  email: string;
  brand?: string;
}

/* ------------------------------------------------------------------ *
 * 3. Mail provider classification from the MX records.
 * ------------------------------------------------------------------ */

interface MxInfo { hostname?: string; priority?: number }

const MX_PROVIDERS: Array<{ match: RegExp; name: string; note: string }> = [
  { match: /(^|\.)google(mail)?\.com$|(^|\.)aspmx\./, name: 'Google Workspace / Gmail', note: 'Google applies its own spam filtering and requires SPF and DKIM to align for bulk senders. Expect excellent inbox placement if configured correctly.' },
  { match: /protection\.outlook\.com$|(^|\.)mail\.protection\.outlook\.com$|(^|\.)outlook\.com$/, name: 'Microsoft 365', note: 'Microsoft enforces its own high-volume sender requirements on the tenant sending domain. A domain that has never sent will be quarantined or rejected regardless of your SPF record.' },
  { match: /(^|\.)yahoo\.com$|yimg\.com$|(^|\.)yahoodns\.net$/, name: 'Yahoo', note: 'Yahoo runs one of the stricter complaint thresholds, and a domain with a poor complaint rate can be blocked outright with no appeal.' },
  { match: /(^|\.)icloud\.com$|(^|\.)apple\.com$/, name: 'iCloud Mail', note: 'Apple relays through its own infrastructure; several SPF records can cause permission errors, so keep the include list to one entry.' },
  { match: /protonmail\.ch$|(^|\.)proton\.mail$|(^|\.)protonmail\.com$/, name: 'Proton Mail', note: 'Proton refuses mail from any server it cannot authenticate, so DKIM and a matching DMARC policy are effectively mandatory.' },
  { match: /fastmail\.com$|messagingengine\.com$/, name: 'Fastmail', note: 'Requires SPF and DKIM; messages that fail authentication are rejected rather than junked.' },
  { match: /amazonses\.com$|email\.amazonaws\.com$/, name: 'Amazon SES', note: 'SES authenticates with its own MAIL FROM domain, so the SPF record must include ses.amazonses.com and the bounce domain must match. Bulk complaints against a SES account affect the account, not just the domain.' },
  { match: /sendgrid\.net$|(^|\.)sendgrid\.com$/, name: 'Twilio SendGrid', note: 'SendGrid requires a dedicated subdomain with SPF and DKIM on it. Using the same subdomain for the corporate mail and for campaigns is a common cause of authentication conflicts.' },
  { match: /mailgun\.org$|(^|\.)mailgun\.org$/, name: 'Mailgun', note: 'Same pattern as SES: a separate sending subdomain with its own SPF and DKIM records.' },
  { match: /(^|\.)zoho\.com$|(^|\.)zohomail\.com$/, name: 'Zoho Mail', note: 'Zoho is strict about a single SPF record. Merge all sending services into one SPF TXT record, since a second record causes a permanent error.' },
  { match: /tutanota\.com$|(^|\.)tuta\.io$/, name: 'Tuta', note: 'Requires authentication and does not accept unauthenticated mail.' },
  { match: /mimecast|proofpoint|barracuda|microsoft\.com$|(^|\.)barracudanetworks\./, name: 'Enterprise gateway or filter', note: 'An inbound gateway in front of a mailbox. Delivery problems here are usually the gateway, not the mailbox provider.' },
]

export interface MxProfileArgs {
  domain: string;
}

/** Which mail provider actually receives mail for a domain, and what that provider demands before it will accept anything. */
export async function mxProviderProfile(args: MxProfileArgs): Promise<string> {
  const domain = (args.domain ?? '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
  if (!domain || !domain.includes('.')) return 'Provide a domain like example.com.'

  const res = await fetch(`${DOH}?name=${encodeURIComponent(domain)}&type=MX`, {
    headers: { 'User-Agent': UA, Accept: 'application/dns-json' },
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new Error(`DNS-over-HTTPS returned ${res.status}.`)
  const body = (await res.json()) as { Status?: number; Answer?: Array<{ type?: number; data?: string }> }
  const answers = body.Answer ?? []
  const rows: MxInfo[] = answers
    .filter((a) => a.type === 15)
    .map((a) => {
      const parts = String(a.data ?? '').trim().split(/\s+/)
      return { priority: Number(parts[0]), hostname: (parts[1] ?? '').replace(/\.$/, '') }
    })
    .filter((m) => m.hostname)

  if (!rows.length) {
    if (body.Status === 3) return `${domain} does not exist in DNS, so there is nothing to check.`
    return [
      `${domain} publishes no MX records, so no mail server is willing to receive email for it.`,
      '',
      'If this domain is not meant to receive mail, publish a null MX of "0 ." to stop senders wasting retries on it. If it is meant to receive mail, the domain is effectively undeliverable until an MX record exists.',
    ].join('\n')
  }
  rows.sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0))
  const nullMx = rows.some((r) => r.priority === 0 && r.hostname === '.')
  if (nullMx) return `${domain} publishes a null MX (0 .), which explicitly forbids delivery. Any mail sent to it will bounce.`

  const matched = new Set<string>()
  const findings: string[] = []
  const host = (r: MxInfo): string => r.hostname ?? ''
  for (const r of rows) {
    for (const p of MX_PROVIDERS) {
      if (!p.match.test(host(r)) || matched.has(p.name)) continue
      matched.add(p.name)
      findings.push(`  ${p.name} (via ${host(r)}, priority ${r.priority})`)
      findings.push(`    ${p.note}`)
    }
  }
  const unmatched = rows.filter((r) => !MX_PROVIDERS.some((p) => p.match.test(host(r))))

  const lines = [
    `Mail provider profile for ${domain}: ${rows.length} MX record(s)`,
    "",
    `  ${rows.map((r) => `${r.priority} ${r.hostname}`).join("\n  ")}`,
    "",
  ]
  if (findings.length) {
    lines.push("Recognised providers:", ...findings)
  } else {
    lines.push("No MX host matched the providers this tool knows about, so the mail is handled by a host outside the common set.")
  }
  if (unmatched.length) {
    lines.push("", `Unmatched MX host(s): ${unmatched.map((r) => r.hostname).join(", ")}. If this is your own domain, the provider is either self-hosted or one this list does not cover, which is worth knowing before you check SPF and DKIM against an assumed vendor.`)
  }
  lines.push(
    "",
    "The provider decides what your sending setup has to satisfy. Cross-check this with email_auth, which reads the SPF, DKIM and DMARC records that have to match what the provider expects.",
  )
  return lines.join('\n')
}
