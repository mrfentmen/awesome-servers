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
