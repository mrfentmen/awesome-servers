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
