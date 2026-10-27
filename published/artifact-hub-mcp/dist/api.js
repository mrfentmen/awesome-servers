const BASE = 'https://artifacthub.io/api/v1/packages/search';
export async function search(args) {
    const q = (args.query ?? '').trim();
    if (!q)
        return 'Provide search terms.';
    const limit = Math.max(1, Math.min(args.limit ?? 10, 25));
    const params = new URLSearchParams({ ts_query_web: q, limit: String(limit) });
    const res = await fetch(`${BASE}?${params.toString()}`, {
        headers: { 'User-Agent': 'mrfentmen-artifact-hub-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Artifact Hub returned ${res.status}`);
    const d = (await res.json());
    const rows = d.packages ?? [];
    if (!rows.length)
        return `No Artifact Hub packages found for "${q}".`;
    return `Artifact Hub packages for "${q}" (${rows.length} shown):\n` +
        rows
            .map((r, i) => {
            const s = (k) => (r[k] != null ? String(r[k]) : '');
            return `${i + 1}. ${s('name')}${s('version') ? ` ${s('version')}` : ''}${s('description') ? ` | ${s('description').slice(0, 90)}` : ''}${s('repository') ? ` | repo ${s('repository')}` : ''}`;
        })
            .join('\n');
}
// ---- muxA tools:
// The existing search tool only ever reads the search route, so the new ones
// read the two other routes the same API publishes: the detail of one package,
// and the site wide statistics.
const API = 'https://artifacthub.io/api/v1';
async function getHub(url) {
    const res = await fetch(url, {
        headers: { 'User-Agent': 'mrfentmen-artifact-hub-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (res.status === 404)
        throw new Error('Artifact Hub does not hold that package.');
    if (!res.ok)
        throw new Error(`Artifact Hub returned ${res.status}`);
    return res.json();
}
export async function hubStats(_args = {}) {
    const d = (await getHub(`${API}/stats`));
    if (typeof d.packages?.total !== 'number')
        throw new Error('Artifact Hub returned no statistics.');
    const total = (row) => (typeof row?.total === 'number' ? row.total : 'not reported');
    // generated_at is milliseconds, verified live, while every other timestamp
    // this API returns (ts, running_total keys) is in seconds
    const counted = typeof d.generated_at === 'number' ? new Date(d.generated_at).toISOString() : 'not reported';
    const lines = [
        `Artifact Hub, counted ${counted}:`,
        `  packages: ${total(d.packages)}`,
        `  repositories: ${total(d.repositories)}`,
        `  organizations: ${total(d.organizations)}`,
        `  users: ${total(d.users)}`,
        `  security report snapshots: ${total(d.snapshots)}`,
    ];
    const top = d.packages.top_views_today ?? [];
    if (top.length) {
        lines.push(`  the ${top.length} most viewed packages today:`);
        for (const row of top)
            lines.push(`    ${row.package?.name ?? '?'} ${row.package?.version ?? ''} - ${row.views ?? 0} views`);
    }
    else {
        lines.push('  no daily view ranking reported.');
    }
    return lines.join('\n');
}

const HUB = 'https://artifacthub.io/api/v1';
export async function packageDetail(args = {}) {
    const kind = String(args?.kind ?? '').trim().toLowerCase();
    const repository = String(args?.repository ?? '').trim().toLowerCase();
    const name = String(args?.name ?? '').trim().toLowerCase();
    if (!/^[a-z0-9-]+$/.test(kind))
        throw new Error('Kind looks like helm, olm, operatorhub or container.');
    if (!/^[a-z0-9._-]+$/.test(repository) || !/^[a-z0-9._-]+$/.test(name))
        throw new Error('Repository and name look like prometheus-community and prometheus.');
    const url = `${HUB}/packages/${kind}/${repository}/${name}`;
    const res = await fetch(url, {
        headers: { 'User-Agent': 'mrfentmen-artifact-hub-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(30000),
    });
    if (res.status === 404)
        throw new Error(`Artifact Hub has no ${kind} package ${repository}/${name}`);
    if (!res.ok)
        throw new Error(`Artifact Hub returned ${res.status}`);
    const p = (await res.json());
    const maintainers = (p.maintainers ?? []).map((m) => m.name ?? m.email).filter(Boolean);
    const versions = (p.available_versions ?? []).slice(0, 6);
    const repo = p.repository ?? {};
    return [
        `${p.name} ${p.version ?? ''} — ${kind} package in ${repo.name ?? repository}`,
        p.description ? String(p.description).trim().slice(0, 300) : '',
        `Licence: ${p.license ?? 'not stated'} · signed ${p.signed ? 'yes' : 'no'} · deprecated ${p.deprecated ? 'yes' : 'no'}`,
        `Subscriptions: ${p.stats?.subscriptions ?? '?'} · webhooks ${p.stats?.webhooks ?? '?'}`,
        maintainers.length ? `Maintainers: ${maintainers.slice(0, 8).join(', ')}` : 'Maintainers: none listed',
        `Repository: ${repo.url ?? '?'}${repo.organization_name ? ` (${repo.organization_name})` : ''}`,
        versions.length ? `Newest versions: ${versions.map((v) => v.version).join(', ')}` : '',
        p.home_url ? `Home: ${p.home_url}` : '',
        p.source_url ? `Source: ${p.source_url}` : '',
        `Page: https://artifacthub.io/packages/${kind}/${repository}/${name}`,
    ].filter(Boolean).join('\n');
}
