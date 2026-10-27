const UA = 'mrfentmen-data-gouv-mcp/1.0';
export async function search(args) {
    const query = (args.query ?? '').trim();
    if (!query)
        return 'Provide search terms.';
    const limit = Math.min(Math.max(Number(args.limit ?? 5) || 5, 1), 20);
    const url = `https://www.data.gouv.fr/api/1/datasets/?q=${encodeURIComponent(query)}&page_size=${limit}`;
    const res = await fetch(url, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`data.gouv.fr returned ${res.status}`);
    const d = (await res.json());
    const data = d.data ?? [];
    if (!data.length)
        return `No datasets for "${query}".`;
    return `data.gouv.fr datasets for "${query}" (${data.length}):\n` +
        data.slice(0, limit).map((x, i) => `${i + 1}. ${x.title ?? '?'} | org: ${x.organization?.name ?? '?'} | views: ${x.nb_views ?? 0} | created: ${String(x.created_at ?? '?').slice(0, 10)}`).join('\n');
}
async function dgGet(version, path) {
    const res = await fetch(`https://www.data.gouv.fr/api/${version}/${path}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`data.gouv.fr returned ${res.status}`);
    return (await res.json());
}
function dgPublisher(org) {
    if (!org)
        return 'not reported';
    if (typeof org === 'string')
        return org;
    return org.name ?? 'not reported';
}
export async function recentDatasets(args) {
    const limit = Math.max(1, Math.min(Math.trunc(args.limit ?? 5) || 5, 20));
    const d = await dgGet(2, `datasets/search/?page_size=${limit}&sort=-created`);
    const rows = (d.data ?? []).slice(0, limit);
    if (!rows.length)
        return 'data.gouv.fr returned no recent datasets.';
    const body = rows.map((x, i) => {
        const created = String(x.created_at ?? 'not reported').slice(0, 10);
        return (`      ${String(i + 1).padStart(2)}. ${x.title ?? 'untitled'}\n` +
            `          publisher: ${dgPublisher(x.organization)} | created: ${created} | id: ${x.id ?? 'not reported'}`);
    });
    return [
        `Newest data.gouv.fr datasets (showing ${rows.length} of ${d.total ?? rows.length}):`,
        body.join('\n'),
    ].join('\n');
}
