const BASE = 'https://api.ssllabs.com/api/v3';

export interface AnalyzeArgs {
  host: string;
}

export async function analyze(args: AnalyzeArgs): Promise<string> {
  const host = (args.host ?? '').trim();
  if (!host) return 'Provide a host name.';
  const res = await fetch(`${BASE}/analyze?host=${encodeURIComponent(host)}&all=done`, {
    headers: { 'User-Agent': 'mrfentmen-ssl-labs-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(90000),
  });
  if (!res.ok) throw new Error(`SSL Labs returned ${res.status}`);
  const d = (await res.json()) as Record<string, unknown>;
  if (d.status === 'ERROR') return `SSL Labs: ${String(d.statusMessage ?? 'scan error')}`;
  const eps = (d.endpoints ?? []) as Array<Record<string, unknown>>;
  if (!eps.length) return `SSL Labs: no endpoints for ${host} (${String(d.status ?? 'unknown')}).`;
  const rows = eps.slice(0, 6).map((e) => {
    const s = (k: string) => (e[k] != null ? String(e[k]) : '');
    const proto = (e.details as Record<string, unknown> | undefined)?.protocols;
    let protoStr = '';
    if (Array.isArray(proto)) {
      protoStr = (proto as Array<Record<string, unknown>>).slice(0, 3)
        .map((p) => `${String(p.name ?? '')} ${String(p.version ?? '')}`).join(', ');
    }
    return `${s('ipAddress')} | grade ${s('grade')}${protoStr ? ` | ${protoStr}` : ''}`;
  });
  return [
    `SSL Labs grade for ${host}:`,
    ...rows,
    `Overall grade: ${String(d.grade ?? 'n/a')}`,
  ].join('\n');
}

// ---- muxB tools:

export interface CertificateLogArgs {
  domain?: string;
  limit?: number;
  include_expired?: boolean;
}

export interface CaaRecordsArgs {
  domain?: string;
}

