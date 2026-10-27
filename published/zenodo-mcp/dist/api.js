const BASE = "https://zenodo.org/api";
const UA = "mrfentmen-zenodo-mcp/1.0 (https://github.com/mrfentmen)";
export class ZenodoError extends Error {
}
async function get(url) {
    const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(30000),
    });
    if (!res.ok)
        throw new ZenodoError(`Zenodo returned HTTP ${res.status}`);
    return (await res.json());
}
export async function search(args) {
    const q = (args.query ?? "").trim();
    if (!q)
        throw new ZenodoError("Provide a search query");
    const limit = Math.min(args.limit ?? 10, 20);
    const d = await get(`${BASE}/records?q=${encodeURIComponent(q)}&size=${limit}`);
    const hits = d?.hits?.hits ?? [];
    if (!hits.length)
        return `No Zenodo records found for \"${q}\"`;
    return `Zenodo results for \"${q}\" (${d?.hits?.total ?? hits.length} total):\n` + hits.map((r, i) => {
        const meta = r?.metadata ?? {};
        const title = meta?.title ?? "untitled";
        const creators = (meta?.creators ?? []).slice(0, 3).map((c) => c?.name).join(", ");
        const type = meta?.resource_type?.title ?? "";
        const date = r?.created ? r.created.slice(0, 10) : "";
        return `${i + 1}. [${r?.id ?? ""}] ${title}\n   ${creators || "unknown"} | ${type} | ${date}`;
    }).join("\n");
}
export async function record(args) {
    const id = Number(args.id);
    if (!Number.isInteger(id) || id <= 0)
        throw new ZenodoError("Provide a positive record ID");
    const r = await get(`${BASE}/records/${id}`);
    if (!r?.id)
        throw new ZenodoError(`Record not found: ${id}`);
    const meta = r?.metadata ?? {};
    const lines = [
        `Record: ${r?.id}`,
        `Title: ${meta?.title ?? "n/a"}`,
        `Creators: ${(meta?.creators ?? []).map((c) => c?.name).join(", ") || "n/a"}`,
        `Type: ${meta?.resource_type?.title ?? "n/a"}`,
        `Published: ${meta?.publication_date ?? "n/a"}`,
    ];
    if (meta?.description)
        lines.push(`\n${meta.description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 500)}`);
    if (r?.links?.self)
        lines.push(`\nURL: ${r.links.self}`);
    return lines.join("\n");
}
// ---- muxE tools:
// search and record together give a record's title, its creators, its type, its
// date and the first 500 characters of its description. Everything else Zenodo
// holds is unread: the files, which is what anyone actually came to download;
// the download and view statistics, which is the only measure of whether a
// dataset was used; and the version history, which is what says whether the DOI
// in a citation is still the current one. All three are on routes verified live.
const ZENODO = 'https://zenodo.org/api';
async function zenGet(path) {
    const res = await fetch(`${ZENODO}${path}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(30000),
    });
    if (!res.ok)
        throw new ZenodoError(`Zenodo returned HTTP ${res.status}`);
    return (await res.json());
}
function recordId(raw) {
    const id = Number(raw);
    if (!Number.isInteger(id) || id <= 0)
        throw new ZenodoError('Provide a positive record ID');
    return id;
}
async function loadRecord(raw) {
    const id = recordId(raw);
    const r = await zenGet(`/records/${id}`);
    if (!r || r.id === undefined)
        throw new ZenodoError(`Record not found: ${id}`);
    return r;
}
const num = (v) => {
    const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN;
    return Number.isFinite(n) && n >= 0 ? n : null;
};
function humanSize(bytes) {
    const n = num(bytes);
    if (n === null)
        return 'not reported';
    if (n < 1000)
        return `${n} B`;
    if (n < 1e6)
        return `${(n / 1e3).toFixed(1)} kB`;
    if (n < 1e9)
        return `${(n / 1e6).toFixed(1)} MB`;
    return `${(n / 1e9).toFixed(2)} GB`;
}
const day = (v) => (typeof v === 'string' && v ? v.slice(0, 10) : null);
export async function record_versions(args) {
    const id = recordId(args?.id);
    const r = await loadRecord(id);
    const meta = r.metadata ?? {};
    const title = typeof meta.title === 'string' ? meta.title : 'untitled';
    const data = await zenGet(`/records/${id}/versions`);
    const versions = Array.isArray(data.hits?.hits) ? data.hits.hits : [];
    const lines = [`Version history of Zenodo record ${id}, ${title}:`, `  ${versions.length} version${versions.length === 1 ? '' : 's'} on file.`];
    if (versions.length <= 1) {
        lines.push('  There is only this one, so the DOI on it is current and nothing has superseded it.');
    }
    const ordered = [...versions].sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));
    for (const v of ordered) {
        const vm = v.metadata ?? {};
        const isCurrent = Number(v.id) === Number(r.id);
        const created = day(v.created) ?? 'not reported';
        const updated = day(v.updated);
        const fileCount = Array.isArray(v.files) ? v.files.length : null;
        const size = Array.isArray(v.files)
            ? v.files.map((f) => num(f.size)).filter((n) => n !== null).reduce((a, b) => a + b, 0)
            : null;
        lines.push('');
        lines.push(`  record ${v.id}${isCurrent ? '  <- this is the record you asked about' : ''}`);
        lines.push(`    doi ${typeof vm.doi === 'string' ? vm.doi : 'not reported'}${typeof vm.conceptdoi === 'string' ? `, concept doi ${vm.conceptdoi}` : ''}`);
        lines.push(`    created ${created}${updated && updated !== created ? `, last updated ${updated}` : ''}`);
        lines.push(`    files ${fileCount === null ? 'not reported' : fileCount}${size !== null && size > 0 ? `, ${humanSize(size)}` : ''}`);
        const vtitle = typeof vm.title === 'string' ? vm.title : 'not reported';
        if (vtitle !== title)
            lines.push(`    title on this version: ${vtitle.slice(0, 90)}`);
    }
    if (versions.length > 1) {
        const latest = ordered[ordered.length - 1];
        if (Number(latest.id) !== Number(r.id)) {
            lines.push('');
            lines.push(`  This is not the newest version: record ${latest.id} supersedes it, so a citation pointing at ${r.doi ?? `record ${r.id}`} refers to superseded content.`);
        }
        const withFiles = ordered.filter((v) => (Array.isArray(v.files) ? v.files.length : 0) > 0);
        lines.push(`  ${withFiles.length} of ${versions.length} versions carry files.`);
    }
    const links = r.links ?? {};
    if (links.versions)
        lines.push(`  versions route: ${links.versions}`);
    if (r.doi)
        lines.push(`  latest version: ${links.latest ?? 'not reported'}`);
    lines.push('');
    lines.push("  The existing record tool reports no version at all, so a DOI copied from it may point at content that has since been replaced.");
    return lines.join('\n');
}
const MAX_BUCKETS = 12;
