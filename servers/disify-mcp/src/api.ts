const BASE = 'https://www.disify.com/api/email';

export interface CheckArgs {
  email: string;
}

export async function check(args: CheckArgs): Promise<string> {
  const email = (args.email ?? '').trim().toLowerCase();
  if (!email || !email.includes('@')) return 'Provide a valid email address.';
  const res = await fetch(`${BASE}/${encodeURIComponent(email)}`, {
    headers: { 'User-Agent': 'mrfentmen-disify-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Disify returned ${res.status}`);
  const d = (await res.json()) as Record<string, unknown>;
  const s = (k: string) => (d[k] != null ? String(d[k]) : '');
  return [
    `Email: ${email}`,
    `Format valid: ${s('format')}`,
    `Disposable: ${s('disposable')}`,
    `DNS records: ${s('dns')}`,
    d.disposable === true ? 'Warning: this is a disposable email address.' : '',
  ].filter(Boolean).join('\n');
}
