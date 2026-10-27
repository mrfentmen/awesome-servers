const BASE = "https://flathub.org/api/v2";
const UA = "mrfentmen-flathub-mcp/1.0 (https://github.com/mrfentmen)";
export class FlathubError extends Error {
}
async function get(url) {
    const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(30000),
    });
    if (!res.ok)
        throw new FlathubError(`Flathub returned HTTP ${res.status}`);
    return (await res.json());
}
async function appDetail(id) {
    try {
        return await get(`${BASE}/appstream/${encodeURIComponent(id)}`);
    }
    catch {
        return null;
    }
}
export async function search(args) {
    const q = (args.query ?? "").trim().toLowerCase();
    if (!q)
        throw new FlathubError("Provide a search query");
    const limit = Math.min(args.limit ?? 8, 10);
    const ids = await get(`${BASE}/appstream`);
    const matches = (ids ?? []).filter((id) => id.toLowerCase().includes(q)).slice(0, limit);
    if (!matches.length)
        return `No apps found for \"${q}\"`;
    const rows = [];
    for (const id of matches) {
        const a = await appDetail(id);
        if (!a?.id) {
            rows.push(`${id}: (detail unavailable)`);
            continue;
        }
        const ver = a?.current_release_version;
        rows.push(`${id} | ${a?.name ?? "n/a"}${ver ? ` | v${ver}` : ""}\n   ${(a?.summary ?? "no summary").slice(0, 130)} | ${a?.developer_name ?? ""}`);
    }
    return `Flathub apps matching \"${q}\":\n` + rows.join("\n");
}
export async function app(args) {
    const id = (args.appId ?? "").trim();
    if (!id)
        throw new FlathubError("Provide an app ID like org.gimp.GIMP");
    const a = await appDetail(id);
    if (!a?.id)
        throw new FlathubError(`App not found: ${id}`);
    const lines = [
        `${a?.name ?? "n/a"} (${a?.id ?? id})`,
        `Summary: ${a?.summary ?? "n/a"}`,
        `Developer: ${a?.developer_name ?? "n/a"}`,
        `Version: ${a?.current_release_version ?? "n/a"}`,
        `\n${(a?.description ?? "no description").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 600)}`,
    ];
    if (a?.urls?.homepage)
        lines.push(`\nHomepage: ${a.urls.homepage}`);
    return lines.join("\n");
}
function bound(value, min, max, fallback) {
    const n = Number(value);
    if (!Number.isFinite(n))
        return fallback;
    return Math.max(min, Math.min(Math.floor(n), max));
}
function plain(value, chars = 200) {
    const text = typeof value === 'string' ? value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '';
    if (!text)
        return 'not reported';
    return text.length > chars ? `${text.slice(0, chars)}...` : text;
}
function isoDate(epochSeconds) {
    const n = Number(epochSeconds);
    if (!Number.isFinite(n) || n <= 0)
        return 'not reported';
    return new Date(n * 1000).toISOString().slice(0, 10);
}
function median(values) {
    if (!values.length)
        return null;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
/** When an app actually shipped: how many releases Flathub lists, their types, the span they cover and how often they land. */
export async function appTimeline(args) {
    const id = (args.appId ?? '').trim();
    if (!id)
        throw new FlathubError('Provide an app ID like org.gimp.GIMP');
    const limit = bound(args.limit, 1, 20, 8);
    const a = await appDetail(id);
    if (!a?.id)
        throw new FlathubError(`App not found: ${id}`);
    const releases = (Array.isArray(a.releases) ? a.releases : []);
    if (!releases.length)
        return `Flathub lists no releases for ${a.name ?? id}.`;
    const stamps = releases.map((r) => Number(r.timestamp)).filter((n) => Number.isFinite(n) && n > 0).sort((x, y) => y - x);
    const gaps = [];
    for (let i = 0; i < stamps.length - 1; i += 1) {
        const gap = (stamps[i] - stamps[i + 1]) / 86400000;
        if (gap >= 0)
            gaps.push(gap);
    }
    const gapMedian = median(gaps);
    const byType = new Map();
    for (const r of releases)
        byType.set(r.type ?? 'type not reported', (byType.get(r.type ?? 'type not reported') ?? 0) + 1);
    const eol = releases.filter((r) => r.date_eol);
    return [
        `Release timeline of ${a.name ?? id}`,
        `Current release: ${a.current_release_version ?? 'not reported'}`,
        `Releases on file: ${releases.length}`,
        `First release: ${stamps.length ? isoDate(stamps[stamps.length - 1]) : 'not reported'}`,
        `Most recent release: ${stamps.length ? isoDate(stamps[0]) : 'not reported'}`,
        `Median gap between releases: ${gapMedian === null ? 'not reported' : `${gapMedian.toFixed(1)} days`}`,
        `By release type: ${[...byType.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(', ')}`,
        `Releases carrying an end of life date: ${eol.length}`,
        `Most recent ${Math.min(limit, releases.length)} release(s):`,
        ...releases.slice(0, limit).map((r) => `- ${isoDate(r.timestamp)} ${r.type ?? 'type not reported'}: ${plain(r.description, 160)}`),
        'Release timestamps are the epoch values Flathub stores with each release entry.',
    ].join('\n');
}
