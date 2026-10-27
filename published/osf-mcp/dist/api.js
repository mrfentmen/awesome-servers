const BASE = 'https://api.osf.io/v2/nodes';
export async function nodes(args) {
    const limit = Math.max(1, Math.min(args.limit ?? 10, 50));
    const res = await fetch(`${BASE}/?page[size]=${limit}`, {
        headers: { 'User-Agent': 'mrfentmen-osf-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`OSF returned ${res.status}`);
    const d = (await res.json());
    const rows = d.data ?? [];
    if (!rows.length)
        return 'No OSF nodes returned.';
    return `Public OSF nodes (${rows.length} shown):\n` +
        rows.map((r, i) => {
            const a = (r.attributes ?? {});
            const s = (k) => (a[k] != null ? String(a[k]) : '');
            return `${i + 1}. ${s('title')} | ${s('date_created').slice(0, 10)} | ${s('category')}`;
        }).join('\n');
}
export async function node(args) {
    const id = (args.id ?? '').trim();
    if (!id)
        return 'Provide a node id.';
    const res = await fetch(`${BASE}/${encodeURIComponent(id)}/`, {
        headers: { 'User-Agent': 'mrfentmen-osf-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`OSF returned ${res.status}`);
    const d = (await res.json());
    const dd = d.data;
    const a = ((dd?.attributes ?? {}) ?? {});
    const s = (k) => (a[k] != null ? String(a[k]) : '');
    const rel = ((dd?.relationships ?? {}) ?? {});
    return [
        s('title') || `Node ${id}`,
        s('description') ? `\n${s('description')}` : '',
        `Category: ${s('category')} | Created: ${s('date_created').slice(0, 10)}`,
        Object.keys(rel).length ? `Relationships: ${Object.keys(rel).slice(0, 8).join(', ')}` : '',
    ].filter(Boolean).join('\n');
}
// ---- muxE tools:
// Both existing tools read /v2/nodes, list the first page of it, and report how
// many rows that page held. They never touch /v2/preprints at all, which is
// where the dated, versioned, DOI-bearing records live, and they never read
// links.meta.total, which is the one field that says how many records exist
// rather than how many arrived. These three are all on the preprints route and
// all verified live.
const PREPRINTS = 'https://api.osf.io/v2/preprints';
const UA_OSF = 'mrfentmen-osf-mcp/1.0';
async function getJson(path) {
    const res = await fetch(`${PREPRINTS}${path}`, {
        headers: { 'User-Agent': UA_OSF, Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`OSF returned ${res.status}`);
    return (await res.json());
}
const attr = (p, key) => p.attributes?.[key];
// OSF returns an empty string for a field it has no value for, and null for
// others, so both are treated as absent rather than printed as a value.
function str(v) {
    if (typeof v === 'string' && v.trim())
        return v.trim();
    if (typeof v === 'number' && Number.isFinite(v))
        return String(v);
    return null;
}
function text(v, max) {
    const s = str(v);
    if (!s)
        return 'not reported';
    return s.length > max ? `${s.slice(0, max)}...` : s;
}
// The provider is only reachable as a subdomain in the relationship link, and
// that subdomain is also the value the provider filter expects, so it is read
// from there rather than from a table kept in this file.
function providerOf(p) {
    const href = p.relationships?.provider?.links?.related?.href;
    if (typeof href !== 'string')
        return null;
    const m = /\/providers\/preprints\/([^/?#]+)/.exec(href);
    return m ? m[1] : null;
}
// subjects arrives as a list of lists of {id, text}, which is flattened here so
// a subject count is a count of subjects.
function subjectsOf(p) {
    const raw = attr(p, 'subjects');
    if (!Array.isArray(raw))
        return [];
    const out = [];
    for (const group of raw) {
        if (Array.isArray(group)) {
            for (const item of group) {
                const t = str(item?.text);
                if (t)
                    out.push(t);
            }
        }
        else {
            const t = str(group?.text);
            if (t)
                out.push(t);
        }
    }
    return out;
}
function tagsOf(p) {
    const raw = attr(p, 'tags');
    if (!Array.isArray(raw))
        return [];
    return raw.map((t) => str(t)).filter((t) => t !== null);
}
const day = (v) => {
    const s = str(v);
    return s ? s.slice(0, 10) : null;
};
const tally = (rows) => {
    const out = new Map();
    for (const r of rows)
        out.set(r, (out.get(r) ?? 0) + 1);
    return out;
};
const sorted = (m) => [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
const pct = (n, total) => (total > 0 ? `${((n / total) * 100).toFixed(1)}%` : 'n/a');
export async function preprint_landscape(args) {
    const limit = Math.max(10, Math.min(100, Math.floor(Number(args?.limit ?? 100) || 100)));
    const provider = (args?.provider ?? '').trim().toLowerCase();
    const params = new URLSearchParams();
    params.set('page[size]', String(limit));
    params.set('sort', 'date_published');
    if (provider)
        params.set('filter[provider]', provider);
    const data = await getJson(`/?${params.toString()}`);
    const rows = Array.isArray(data.data) ? data.data : [];
    if (!rows.length) {
        const lines = [`OSF returned no preprints${provider ? ` for provider ${provider}` : ''}.`];
        if (provider)
            lines.push('  the provider filter takes a subdomain such as psyarxiv, engrxiv or lawarchive, and an unknown one returns zero rather than an error.');
        return lines.join('\n');
    }
    const total = typeof data.links?.meta?.total === 'number' ? data.links.meta.total : null;
    const published = rows.filter((p) => attr(p, 'is_published') === true).length;
    const withDoi = rows.filter((p) => str(attr(p, 'doi')) !== null).length;
    const latest = rows.filter((p) => attr(p, 'is_latest_version') === true).length;
    const dates = rows.map((p) => day(attr(p, 'date_published'))).filter((d) => d !== null);
    const lines = [
        `What the OSF preprint feed looks like, newest ${rows.length} first${provider ? ` on provider ${provider}` : ''}:`,
        `  ${total === null ? `${rows.length} records examined` : `${total.toLocaleString('en-US')} records match in the index, ${rows.length} examined here`}.`,
    ];
    if (total !== null && total > rows.length) {
        // 25 of 202,373 rounds to 0.0%, which tells the reader nothing, so the
        // share is only quoted when it is actually a readable fraction.
        const share = (rows.length / total) * 100;
        const how = share >= 0.1 ? `the most recent ${pct(rows.length, total)} of` : 'a very small slice of';
        lines.push(`  this is ${how} the feed rather than the whole of it, so the counts below describe the head of the stream rather than the archive.`);
    }
    if (dates.length) {
        const sortedDates = [...dates].sort();
        lines.push(`  publication dates run ${sortedDates[0]} to ${sortedDates[sortedDates.length - 1]}.`);
        const byDay = tally(dates);
        const busiest = [...byDay.entries()].sort((a, b) => b[1] - a[1])[0];
        lines.push(`  busiest single day ${busiest[0]} with ${busiest[1]}, which is ${pct(busiest[1], rows.length)} of this page.`);
    }
    lines.push(`  marked published: ${published} of ${rows.length} (${pct(published, rows.length)}).`);
    lines.push(`  carrying a doi: ${withDoi} of ${rows.length} (${pct(withDoi, rows.length)}).`);
    lines.push(`  the latest version: ${latest} of ${rows.length}, so ${rows.length - latest} on this page are superseded revisions.`);
    const providers = sorted(tally(rows.map((p) => providerOf(p) ?? 'not reported')));
    lines.push(`  providers on this page: ${providers.map(([k, v]) => `${k} (${v})`).join(', ')}.`);
    const subjects = tally(rows.flatMap((p) => subjectsOf(p)));
    if (subjects.size) {
        lines.push('');
        lines.push(`  the ${Math.min(15, subjects.size)} commonest subjects:`);
        for (const [s, n] of sorted(subjects).slice(0, 15))
            lines.push(`    ${s.padEnd(38)}${n}`);
        if (subjects.size > 15)
            lines.push(`    and ${subjects.size - 15} further subject(s) not listed.`);
        lines.push(`  subject labels in use: ${subjects.size} across ${rows.length} preprints, an average of ${(subjects.size / rows.length).toFixed(1)} distinct subjects each.`);
    }
    const tags = sorted(tally(rows.flatMap((p) => tagsOf(p))));
    if (tags.length) {
        lines.push('');
        lines.push(`  the ${Math.min(12, tags.length)} commonest tags: ${tags.slice(0, 12).map(([k, n]) => `${k} (${n})`).join(', ')}.`);
        const once = tags.filter(([, n]) => n === 1).length;
        lines.push(`  ${once} of ${tags.length} distinct tags appear exactly once, so a long tail of one-off keywords is normal here rather than a sign of anything.`);
    }
    lines.push('');
    lines.push("  The existing tools report one page of /v2/nodes and nothing about preprints, publication volume, DOIs or subject mix.");
    return lines.join('\n');
}
