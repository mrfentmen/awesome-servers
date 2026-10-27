const BASE = 'https://api.gleif.org/api/v1';
export async function search(args) {
    const query = (args.query ?? '').trim();
    if (!query)
        return 'Provide an entity name.';
    const limit = Math.max(1, Math.min(args.limit ?? 10, 50));
    const q = encodeURIComponent(`entity.legalName:${query}*`);
    const res = await fetch(`${BASE}/lei-records?filter[fulltext]=${encodeURIComponent(query)}&page[size]=${limit}`, {
        headers: { 'User-Agent': 'mrfentmen-gleif-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`GLEIF returned ${res.status}`);
    const d = (await res.json());
    const rows = d.data ?? [];
    if (!rows.length)
        return `No entities found for "${query}".`;
    return `Legal entities for "${query}" (${rows.length} shown):\n` +
        rows.map((r, i) => {
            const a = (r.attributes ?? {});
            const entity = (a.entity ?? {});
            const names = (entity.legalName ?? {});
            const reg = (a.registration ?? {});
            const status = (reg.registrationStatus ?? {});
            const s = (k) => (entity[k] != null ? String(entity[k]) : '');
            return `${i + 1}. ${String(names.name ?? '')} | ${String(a.lei ?? '')} | ${String(status.name ?? '')}`;
        }).join('\n');
}
export async function lei(args) {
    const id = (args.id ?? '').trim().toUpperCase();
    if (!id)
        return 'Provide an LEI code.';
    const res = await fetch(`${BASE}/lei-records/${encodeURIComponent(id)}`, {
        headers: { 'User-Agent': 'mrfentmen-gleif-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`GLEIF returned ${res.status}`);
    const d = (await res.json());
    const dd = d.data;
    const a = ((dd?.attributes ?? d.attributes) ?? {});
    const entity = (a.entity ?? {});
    const names = (entity.legalName ?? {});
    const address = (entity.legalAddress ?? {});
    const reg = (a.registration ?? {});
    const s = (k) => (entity[k] != null ? String(entity[k]) : '');
    const aS = (k) => (address[k] != null ? String(address[k]) : '');
    return [
        `${String(names.name ?? '')}`,
        `LEI: ${String(a.lei ?? id)}`,
        `Status: ${String(reg.registrationStatus?.name ?? '')}`,
        s('legalForm') ? `Legal form: ${String(entity.legalForm?.name ?? s('legalForm'))}` : '',
        `Address: ${aS('addressLines') ? String(address.addressLines).replace(/,/g, ', ') : ''} ${aS('city')} ${aS('country')}`.replace(/  +/g, ' '),
    ].filter(Boolean).join('\n');
}
