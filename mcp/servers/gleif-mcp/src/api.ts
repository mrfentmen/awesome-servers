const BASE = 'https://api.gleif.org/api/v1';

export interface SearchArgs {
  query: string;
  limit?: number;
}

export interface LeiArgs {
  id: string;
}

export async function search(args: SearchArgs): Promise<string> {
  const query = (args.query ?? '').trim();
  if (!query) return 'Provide an entity name.';
  const limit = Math.max(1, Math.min(args.limit ?? 10, 50));
  const q = encodeURIComponent(`entity.legalName:${query}*`);
  const res = await fetch(`${BASE}/lei-records?filter[fulltext]=${encodeURIComponent(query)}&page[size]=${limit}`, {
    headers: { 'User-Agent': 'mrfentmen-gleif-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`GLEIF returned ${res.status}`);
  const d = (await res.json()) as { data?: Array<Record<string, unknown>> };
  const rows = d.data ?? [];
  if (!rows.length) return `No entities found for "${query}".`;
  return `Legal entities for "${query}" (${rows.length} shown):\n` +
    rows.map((r, i) => {
      const a = (r.attributes ?? {}) as Record<string, unknown>;
      const entity = (a.entity ?? {}) as Record<string, unknown>;
      const names = (entity.legalName ?? {}) as Record<string, unknown>;
      const reg = (a.registration ?? {}) as Record<string, unknown>;
      const status = (reg.registrationStatus ?? {}) as Record<string, unknown>;
      const s = (k: string) => (entity[k] != null ? String(entity[k]) : '');
      return `${i + 1}. ${String(names.name ?? '')} | ${String(a.lei ?? '')} | ${String(status.name ?? '')}`;
    }).join('\n');
}

export async function lei(args: LeiArgs): Promise<string> {
  const id = (args.id ?? '').trim().toUpperCase();
  if (!id) return 'Provide an LEI code.';
  const res = await fetch(`${BASE}/lei-records/${encodeURIComponent(id)}`, {
    headers: { 'User-Agent': 'mrfentmen-gleif-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`GLEIF returned ${res.status}`);
  const d = (await res.json()) as Record<string, unknown>;
  const dd = d.data as Record<string, unknown> | undefined; const a = ((dd?.attributes ?? d.attributes) ?? {}) as Record<string, unknown>;
  const entity = (a.entity ?? {}) as Record<string, unknown>;
  const names = (entity.legalName ?? {}) as Record<string, unknown>;
  const address = (entity.legalAddress ?? {}) as Record<string, unknown>;
  const reg = (a.registration ?? {}) as Record<string, unknown>;
  const s = (k: string) => (entity[k] != null ? String(entity[k]) : '');
  const aS = (k: string) => (address[k] != null ? String(address[k]) : '');
  return [
    `${String(names.name ?? '')}`,
    `LEI: ${String(a.lei ?? id)}`,
    `Status: ${String((reg.registrationStatus as Record<string, unknown> | undefined)?.name ?? '')}`,
    s('legalForm') ? `Legal form: ${String((entity.legalForm as Record<string, unknown> | undefined)?.name ?? s('legalForm'))}` : '',
    `Address: ${aS('addressLines') ? String(address.addressLines).replace(/,/g, ', ') : ''} ${aS('city')} ${aS('country')}`.replace(/  +/g, ' '),
  ].filter(Boolean).join('\n');
}

// ---- muxB tools:
type GleifAttrs = {
    lei?: string;
    bic?: string | null;
    mic?: string | null;
    gem?: string | null;
    qcc?: string | null;
    ocid?: string | null;
    entity?: {
      legalName?: { name?: string; nameLanguage?: string };
      status?: string;
      category?: string;
      subCategory?: string | null;
      jurisdiction?: string;
      registeredAs?: string | null;
      registeredAt?: { id?: string };
      legalAddress?: { addressLines?: string[]; city?: string; country?: string };
      otherNames?: { name?: string; language?: string }[];
      transliteratedOtherNames?: { name?: string }[];
      expiration?: { date?: string | null; reason?: string | null };
      directParent?: { lei?: string; name?: string } | null;
      ultimateParent?: { lei?: string; name?: string } | null;
    };
    registration?: {
      status?: string;
      initialRegistrationDate?: string;
      lastUpdateDate?: string;
      nextRenewalDate?: string;
      corroborationLevel?: string;
      managingLou?: string;
    };
};

type GleifRecord = { attributes?: GleifAttrs };

// JSON:API: a collection response puts an array in `data`, a single-resource
// response puts one object there.
type GleifPage = {
  data?: Array<{ attributes?: Record<string, unknown> }> | { attributes?: Record<string, unknown> };
  meta?: { pagination?: { total?: number; currentPage?: number; perPage?: number } };
};

