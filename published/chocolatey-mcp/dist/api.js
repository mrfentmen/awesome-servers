const BASE = 'https://community.chocolatey.org/api/v2';
export async function search(args) {
    const q = (args.query ?? '').trim();
    if (!q)
        return 'Provide search terms.';
    const limit = Math.max(1, Math.min(args.limit ?? 10, 25));
    const res = await fetch(`${BASE}/Search()?$filter=IsLatestVersion&$search=%27${encodeURIComponent(q)}%27&$top=${limit}&$format=json`, {
        headers: { 'User-Agent': 'mrfentmen-chocolatey-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Chocolatey returned ${res.status}`);
    const d = (await res.json());
    const rows = d.d?.results ?? [];
    if (!rows.length)
        return `No Chocolatey packages found for "${q}".`;
    return `Chocolatey packages for "${q}" (${rows.length} shown):\n` +
        rows
            .map((r, i) => {
            const s = (k) => (r[k] != null ? String(r[k]) : '');
            return `${i + 1}. ${s('Title')} ${s('Version')}${s('Description') ? ` | ${s('Description').replace(/<[^>]*>/g, '').slice(0, 80)}` : ''}`;
        })
            .join('\n');
}
// ---- muxA tools:
const PKGS = 'https://community.chocolatey.org/api/v2/Packages()';
// Chocolatey's v2 OData feed dropped JSON support, so entries arrive as Atom XML.
// This pulls one <d:Field> out of an <entry> body.
function field(entry, name) {
    const match = new RegExp(`<d:${name}[^>]*>([\\s\\S]*?)</d:${name}>`).exec(entry);
    if (!match)
        return '';
    return match[1]
        .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
        .replace(/<[^>]*>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();
}
async function entries(query) {
    const res = await fetch(`${PKGS}?${query}`, {
        headers: { 'User-Agent': 'mrfentmen-chocolatey-mcp/1.0' },
        signal: AbortSignal.timeout(30000),
    });
    if (!res.ok)
        throw new Error(`Chocolatey returned ${res.status}`);
    const xml = await res.text();
    if (/<error[\s>]/.test(xml)) {
        const message = field(xml, 'message');
        throw new Error(`Chocolatey rejected the query: ${message || 'unspecified OData error'}`);
    }
    return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map((m) => {
        const row = {};
        for (const key of rowFields)
            row[key] = field(m[1], key);
        return row;
    });
}
const rowFields = [
    'Title', 'Version', 'Description', 'Tags', 'Copyright', 'Dependencies',
    'DownloadCount', 'VersionDownloadCount', 'IsLatestVersion', 'IsPrerelease',
    'Language', 'Published', 'LicenseUrl', 'PackageSize', 'ProjectUrl',
    'ReleaseNotes', 'ProjectSourceUrl', 'DocsUrl', 'BugTrackerUrl', 'IsApproved',
];
function odata(value) {
    return value.replace(/'/g, "''");
}
function num(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n.toLocaleString('en-US') : 'not reported';
}
function short(value, max) {
    const t = value.replace(/\s+/g, ' ').trim();
    return t.length > max ? `${t.slice(0, max)}...` : t;
}
export async function popularPackages(args) {
    const limit = Math.max(1, Math.min(Math.round(args.limit ?? 15), 50));
    const filter = args.approvedOnly === false ? '' : '%20and%20IsApproved%20eq%20true';
    const rows = await entries(`$filter=IsLatestVersion${filter}&$orderby=DownloadCount%20desc&$top=${limit}`);
    if (!rows.length) {
        return args.approvedOnly === false
            ? 'Chocolatey returned no latest-version packages.'
            : 'Chocolatey returned no approved latest-version packages.';
    }
    return [
        `Most downloaded approved Chocolatey packages (${rows.length} shown):`,
        ...rows.map((p, i) => {
            const title = p.Title || 'untitled';
            return `${i + 1}. ${title} ${p.Version} | ${num(p.DownloadCount)} downloads` +
                `${p.Published ? ` | published ${p.Published.slice(0, 10)}` : ''}` +
                `${p.Description ? ` | ${short(p.Description, 70)}` : ''}`;
        }),
    ].join('\n');
}
