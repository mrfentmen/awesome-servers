const BASE = 'https://data.gov.uk/api/3/action/package_search';
export async function search(args) {
    const q = (args.query ?? '').trim();
    if (!q)
        return 'Provide search terms.';
    const limit = Math.max(1, Math.min(args.limit ?? 10, 25));
    const params = new URLSearchParams({ q, rows: String(limit) });
    const res = await fetch(`${BASE}?${params.toString()}`, {
        headers: { 'User-Agent': 'mrfentmen-data-gov-uk-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`data.gov.uk returned ${res.status}`);
    const d = (await res.json());
    const rows = d.result?.results ?? [];
    if (!rows.length)
        return `No data.gov.uk packages found for "${q}".`;
    return `data.gov.uk packages for "${q}" (${d.result?.count ?? rows.length} total, ${rows.length} shown):\n` +
        rows
            .map((r, i) => {
            const s = (k) => (r[k] != null ? String(r[k]) : '');
            return `${i + 1}. ${s('title')}${s('notes') ? ` | ${s('notes').slice(0, 90)}` : ''}${s('metadata_modified') ? ` | ${String(s('metadata_modified')).slice(0, 10)}` : ''}`;
        })
            .join('\n');
}
// ---- muxE tools:
// The one existing tool does free text package_search and prints three fields.
// The new ones ask data.gov.uk two other questions: everything about one named
// dataset, and everything one publisher has published. data.gov.uk now 301s every
// api/3/action call to ckan.publishing.service.gov.uk, verified live, so the
// canonical host is used directly rather than paying for the redirect each time.
const CANON = 'https://ckan.publishing.service.gov.uk/api/3/action';
const DG_UA = 'mrfentmen-data-gov-uk-mcp/1.0';
async function dgGet(path, params) {
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(`${CANON}/${path}?${qs}`, {
        headers: { 'User-Agent': DG_UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(30000),
    });
    if (res.status === 404)
        throw new Error('data.gov.uk has no record for that.');
    if (res.status === 403)
        throw new Error(`data.gov.uk refused that request with HTTP 403; its nginx only allows package_search, package_show and package_list.`);
    if (!res.ok)
        throw new Error(`data.gov.uk returned ${res.status}`);
    const body = (await res.json());
    if (body?.success === false) {
        const why = typeof body.error === 'string' ? body.error : body.error?.message;
        throw new Error(`data.gov.uk said: ${why ?? 'the request was rejected'}`);
    }
    return body;
}
const dayOf = (value) => (value ? String(value).slice(0, 10) : 'not reported');
export async function publisherDatasets(args) {
    const org = (args?.organization ?? '').trim();
    if (!org)
        throw new Error('Provide the publisher slug, the name field of data.gov.uk/organisation/<slug>, not the display title.');
    if (!/^[\w.-]{1,120}$/.test(org)) {
        throw new Error('A publisher slug may only hold letters, digits, dots, dashes and underscores.');
    }
    const limit = Math.max(1, Math.min(Number(args?.limit ?? 10) || 10, 25));
    const d = await dgGet('package_search', { fq: `organization:${org}`, rows: String(limit) });
    const rows = Array.isArray(d.result?.results) ? d.result?.results : [];
    const count = typeof d.result?.count === 'number' ? d.result.count : null;
    if (!rows.length) {
        if (count === 0)
            return `data.gov.uk lists no dataset for the publisher "${org}".`;
        return `data.gov.uk reports ${count} dataset(s) for "${org}" but returned none.`;
    }
    const publisher = rows[0].organization?.title ?? org;
    const lines = [
        `Datasets published by ${publisher} (${org}) on data.gov.uk:`,
        `  datasets the catalogue reports: ${count !== null ? count.toLocaleString('en-US') : 'not reported'}`,
        `  shown here: ${rows.length}`,
    ];
    rows.forEach((p, i) => {
        const resources = Array.isArray(p.resources) ? p.resources : [];
        const formats = new Set(resources.map((r) => r.format).filter(Boolean).map(String));
        lines.push(`${i + 1}. ${p.title || p.name || 'title not reported'}`);
        lines.push(`   name ${p.name ?? 'not reported'}, licence ${p.license_title ?? 'not reported'}, last changed ${dayOf(p.metadata_modified)}`);
        lines.push(`   resources ${typeof p.num_resources === 'number' ? p.num_resources : 'not reported'}${formats.size ? ` (${[...formats].slice(0, 6).join(', ')})` : ''}, tags ${typeof p.num_tags === 'number' ? p.num_tags : 'not reported'}`);
    });
    if (count !== null && count > rows.length) {
        lines.push(`  ${(count - rows.length).toLocaleString('en-US')} further dataset(s) exist for this publisher; ask for a higher limit to page further in.`);
    }
    return lines.join('\n');
}

const CKAN = 'https://ckan.publishing.service.gov.uk/api/3/action';
export async function datasetDetail(args = {}) {
    const name = String(args?.name ?? '').trim();
    if (!/^[a-z0-9][a-z0-9._-]*$/i.test(name))
        throw new Error('Provide a dataset slug, the part after data.gov.uk/dataset/.');
    const res = await fetch(`${CKAN}/package_show?id=${encodeURIComponent(name)}`, {
        headers: { 'User-Agent': 'mrfentmen-data-gov-uk-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(30000),
    });
    if (!res.ok)
        throw new Error(`data.gov.uk returned ${res.status}`);
    const body = (await res.json());
    if (!body.success || !body.result)
        throw new Error(`data.gov.uk has no dataset "${name}"`);
    const d = body.result;
    const resources = Array.isArray(d.resources) ? d.resources : [];
    const tags = (d.tags ?? []).map((t) => t.name).filter(Boolean);
    const vocab = Object.entries(d.extras ?? {}).filter(([k]) => /vocab|theme/i.test(k)).slice(0, 5);
    return [
        `${d.title ?? name} — ${d.name}`,
        `Publisher: ${d.organization?.title ?? 'unknown'} · state ${d.state ?? '?'} · version ${d.version ?? '?'}`,
        `Licence: ${d.license_title ?? d.license_id ?? 'not stated'}`,
        `Created: ${String(d.metadata_created ?? '').slice(0, 10) || '?'} · updated: ${String(d.metadata_modified ?? '').slice(0, 10) || '?'}`,
        tags.length ? `Tags: ${tags.slice(0, 12).join(', ')}` : 'Tags: none',
        vocab.length ? `Vocabularies: ${vocab.map(([k, v]) => `${k}=${String(v).slice(0, 60)}`).join(' · ')}` : '',
        '',
        `${resources.length} resource(s):`,
        ...resources.slice(0, 25).map((r, i) => `${i + 1}. ${r.name ?? '(unnamed)'} [${r.format ?? '?'}]${r.size ? ` ${Math.round(Number(r.size) / 1024)} KB` : ''} — ${r.url}`),
        resources.length > 25 ? `… ${resources.length - 25} more resource(s) on the dataset page.` : '',
        `Page: https://www.data.gov.uk/dataset/${d.name}`,
    ].filter(Boolean).join('\n');
}
