const BASE = 'https://api.ensideas.com/ens/resolve';

export interface ResolveArgs {
  name: string;
}

export async function resolve(args: ResolveArgs): Promise<string> {
  const name = (args.name ?? '').trim().toLowerCase();
  if (!name) return 'Provide an ENS name like vitalik.eth.';
  const res = await fetch(`${BASE}/${encodeURIComponent(name)}`, {
    headers: { 'User-Agent': 'mrfentmen-ensideas-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Ensideas returned ${res.status}`);
  const d = (await res.json()) as Record<string, unknown>;
  const s = (k: string) => (d[k] != null ? String(d[k]) : '');
  return [
    `${s('name')}`,
    s('address') ? `Address: ${s('address')}` : '',
    s('displayName') ? `Display name: ${s('displayName')}` : '',
    s('avatar') ? `Avatar: ${s('avatar').slice(0, 90)}` : '',
    s('description') ? `Desc: ${s('description').slice(0, 100)}` : '',
  ].filter(Boolean).join('\n') || `No ENS record found for ${name}.`;
}

// ---- muxE tools:
// The one existing tool calls api.ensideas.com, which answers four fields and
// nothing else, verified live. The new tools go to the two keyless services the
// same ENS name reaches: the ENS metadata service, which holds the text records
// the existing tool never reads, and a block explorer, which describes the
// account the name points at rather than the name itself.

const ENSDATA = "https://api.ensdata.net/";

const ENS_UA = "mrfentmen-ensideas-mcp/1.0";

const show = (v: unknown): string => (v === undefined || v === null || v === '' ? 'not reported' : String(v));

async function jsonGet<T>(url: string, notFound?: string): Promise<T> {
  const res = await fetch(url, {
    headers: { 'User-Agent': ENS_UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (res.status === 404) throw new Error(notFound ?? 'That service has nothing at this address.');
  if (res.status === 429) throw new Error('That service rate limited the request, wait a moment and retry.');
  if (!res.ok) throw new Error(`That service returned ${res.status}.`);
  const raw = await res.text();
  if (!raw.trim()) throw new Error('That service returned an empty body.');
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error('That service returned a body that is not JSON.');
  }
}

export interface EnsMetadataArgs {
  name: string;
}

export async function ensMetadata(args: EnsMetadataArgs): Promise<string> {
  const name = (args?.name ?? '').trim().toLowerCase();
  if (!name) return 'Provide an ENS name like vitalik.eth.';
  if (!/^[a-z0-9][a-z0-9-]*\.[a-z]{2,}$/.test(name)) {
    return `"${args?.name}" does not look like an ENS name; those look like vitalik.eth.`;
  }
  const meta = await jsonGet<Record<string, unknown>>(
    `${ENSDATA}${encodeURIComponent(name)}`,
    `The ENS metadata service holds nothing for "${name}".`,
  );
  const address = show(meta.address ?? meta.ens_primary);
  const keys = Object.keys(meta).filter((k) => !['wallets', 'metadata'].includes(k));
  const textRecords = keys.filter(
    (k) => typeof meta[k] === 'string' && !['ens', 'ens_primary', 'address', 'avatar', 'avatar_small', 'avatar_url', 'header', 'contentHash', 'resolverAddress'].includes(k),
  );
  const wallets = meta.wallets && typeof meta.wallets === 'object' ? (meta.wallets as Record<string, unknown>) : {};
  const lines = [
    `ENS metadata for ${show(meta.ens ?? name)}:`,
    `  resolves to: ${address}`,
    `  primary name field: ${show(meta.ens_primary)}`,
    `  content hash: ${show(meta.contentHash)}`,
    `  resolver contract: ${show(meta.resolverAddress)}`,
    `  avatar: ${show(meta.avatar ?? meta.avatar_url)}`,
    `  smaller avatar: ${show(meta.avatar_small)}`,
    `  header image: ${show(meta.header)}`,
    `  description: ${show(meta.description)}`,
  ];
  const walletKeys = Object.keys(wallets);
  if (walletKeys.length) {
    lines.push(`  wallets across ${walletKeys.length} chain(s):`);
    for (const chain of walletKeys.slice(0, 15)) {
      lines.push(`    ${chain}: ${show(wallets[chain])}`);
    }
    if (walletKeys.length > 15) lines.push(`    and ${walletKeys.length - 15} more chain(s)`);
  } else {
    lines.push('  wallets: no chain listed.');
  }
  if (textRecords.length) {
    lines.push(`  other text records (${textRecords.length}):`);
    for (const key of textRecords.slice(0, 25)) lines.push(`    ${key}: ${String(meta[key]).slice(0, 160)}`);
    if (textRecords.length > 25) lines.push(`    and ${textRecords.length - 25} more record(s)`);
  } else {
    lines.push('  other text records: none beyond the fields above.');
  }
  lines.push(`  fields the service returned: ${keys.length + (walletKeys.length ? 1 : 0)}`);
  lines.push('  the resolve tool reads four of these fields and cannot see the content hash, the resolver, the avatars, the header, the wallets or any other text record.');
  return lines.join('\n');
}

export interface AddressProfileArgs {
  name?: string;
  address?: string;
}

