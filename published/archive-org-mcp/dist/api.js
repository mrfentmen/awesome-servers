const m0 = (() => {
    /**
     * Internet Archive client — keyless.
     *  - advancedsearch.php: full-text + metadata search over ~200M items.
     *  - metadata/{identifier}: file manifests for an item.
     */
    const SEARCH = "https://archive.org/advancedsearch.php";
    const META = "https://archive.org/metadata";
    class ArchiveError extends Error {
    }
    async function getJson(url) {
        const res = await fetch(url, { headers: { "User-Agent": "archive-org-mcp/1.0" } });
        if (!res.ok)
            throw new ArchiveError(`Internet Archive error ${res.status} for ${url.slice(0, 120)}`);
        return (await res.json());
    }
    async function searchItems(query, mediatype, limit = 8) {
        const q = mediatype ? `(${query}) AND mediatype:${mediatype}` : query;
        const fl = ["identifier", "title", "mediatype", "year", "downloads", "collection", "description"].join(",");
        const url = `${SEARCH}?q=${encodeURIComponent(q)}&fl[]=${fl}&rows=${limit}&page=1&output=json`;
        const data = await getJson(url);
        return (data.response?.docs ?? []).map((d) => ({
            identifier: d.identifier ?? "",
            title: d.title ?? d.identifier,
            mediatype: d.mediatype,
            year: d.year,
            downloads: d.downloads,
            collection: d.collection,
            description: d.description,
        }));
    }
    async function getItemDetails(identifier) {
        const data = await getJson(`${META}/${encodeURIComponent(identifier)}`);
        const files = (data.files ?? [])
            .filter((f) => f.name && !f.name.endsWith("_files.xml") && !f.name.endsWith("_meta.xml"))
            .map((f) => ({
            name: f.name ?? "",
            size: f.size,
            format: f.format,
            length: f.length,
            title: f.title,
        }))
            .slice(0, 30);
        return {
            identifier: data.metadata?.identifier ?? identifier,
            title: data.metadata?.title ?? data.metadata?.identifier,
            mediatype: data.metadata?.mediatype,
            description: data.metadata?.description,
            files,
        };
    }
    function fmtSize(bytes) {
        if (!bytes)
            return "";
        const units = ["B", "KB", "MB", "GB", "TB"];
        let v = bytes;
        let i = 0;
        while (v >= 1024 && i < units.length - 1) {
            v /= 1024;
            i++;
        }
        return `${v.toFixed(1)} ${units[i]}`;
    }
    function formatItem(it, index) {
        const meta = [
            it.mediatype,
            it.year,
            it.downloads ? `${it.downloads.toLocaleString()} downloads` : "",
        ]
            .filter(Boolean)
            .join(" · ");
        const lines = [
            `${index + 1}. ${it.title ?? it.identifier} [${it.identifier}]`,
            meta,
            `https://archive.org/details/${it.identifier}`,
        ].filter(Boolean);
        return lines.join("\n");
    }
    return { ArchiveError, fmtSize, formatItem, getItemDetails, searchItems };
})();
const m1 = (() => {
    /**
     * Wayback Machine client. Keyless.
     *  - CDX API lists snapshot history for a URL.
     *  - /wayback/available finds the nearest snapshot.
     *  - /web/{timestamp}id_/{url} serves the archived page content.
     */
    const CDX = "https://web.archive.org/cdx/search/cdx";
    const AVAILABLE = "https://archive.org/wayback/available";
    class WaybackError extends Error {
    }
    async function getText(url) {
        const res = await fetch(url, {
            headers: { "User-Agent": "wayback-mcp/1.0", Accept: "application/json,text/plain,text/html" },
        });
        if (!res.ok)
            throw new WaybackError(`Wayback error ${res.status} for ${url.slice(0, 100)}`);
        return res.text();
    }
    async function getSnapshots(url, limit = 10) {
        const q = `${CDX}?url=${encodeURIComponent(url)}&output=json&fl=timestamp,original,statuscode,mimetype,length&filter=statuscode:200&limit=${limit}`;
        const text = await getText(q);
        const rows = JSON.parse(text);
        if (rows.length <= 1)
            return [];
        const [, ...data] = rows;
        return data.map((r) => ({
            timestamp: r[0] ?? "",
            original: r[1] ?? url,
            statusCode: r[2] ?? "",
            mimeType: r[3] ?? "",
            length: r[4] ?? "",
            url: `https://web.archive.org/web/${r[0]}id_/${r[1] ?? url}`,
        }));
    }
    async function getAvailability(url) {
        const text = await getText(`${AVAILABLE}?url=${encodeURIComponent(url)}`);
        const d = JSON.parse(text);
        const closest = d.archived_snapshots?.closest;
        if (!closest?.url)
            return null;
        return {
            timestamp: closest.timestamp ?? "",
            original: url,
            statusCode: closest.status ?? "",
            mimeType: "",
            length: "",
            url: closest.url,
        };
    }
    async function getSnapshotText(timestamp, originalUrl, maxChars = 15000) {
        const target = `https://web.archive.org/web/${timestamp}id_/${originalUrl}`;
        const raw = await getText(target);
        const plain = raw
            .replace(/<script[\s\S]*?<\/script>/gi, " ")
            .replace(/<style[\s\S]*?<\/style>/gi, " ")
            .replace(/<[^>]+>/g, " ")
            .replace(/&nbsp;/g, " ")
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/\s+/g, " ")
            .trim();
        return plain.slice(0, maxChars);
    }
    function fmtTimestamp(ts) {
        if (ts.length < 12)
            return ts;
        return `${ts.slice(0, 4)}-${ts.slice(4, 6)}-${ts.slice(6, 8)} ${ts.slice(8, 10)}:${ts.slice(10, 12)} UTC`;
    }
    function formatSnapshot(s, index) {
        const head = `${index !== undefined ? `${index + 1}. ` : ""}${fmtTimestamp(s.timestamp)}`;
        const lines = [
            head,
            `Status ${s.statusCode || "?"}${s.mimeType ? ` · ${s.mimeType}` : ""}${s.length ? ` · ${s.length} bytes` : ""}`,
            s.url,
        ].filter(Boolean);
        return lines.join("\n");
    }
    return { WaybackError, fmtTimestamp, formatSnapshot, getAvailability, getSnapshotText, getSnapshots };
})();
export const ArchiveError = m0.ArchiveError;
export const WaybackError = m1.WaybackError;
export const fmtSize = m0.fmtSize;
export const fmtTimestamp = m1.fmtTimestamp;
export const formatItem = m0.formatItem;
export const formatSnapshot = m1.formatSnapshot;
export const getAvailability = m1.getAvailability;
export const getItemDetails = m0.getItemDetails;
export const getSnapshotText = m1.getSnapshotText;
export const getSnapshots = m1.getSnapshots;
export const searchItems = m0.searchItems;
export const m0_fmtSize = m0.fmtSize;
export const m0_ArchiveError = m0.ArchiveError;
export const m0_getItemDetails = m0.getItemDetails;
export const m0_formatItem = m0.formatItem;
export const m0_searchItems = m0.searchItems;
export const m1_fmtTimestamp = m1.fmtTimestamp;
export const m1_formatSnapshot = m1.formatSnapshot;
export const m1_getAvailability = m1.getAvailability;
export const m1_WaybackError = m1.WaybackError;
export const m1_getSnapshotText = m1.getSnapshotText;
export const m1_getSnapshots = m1.getSnapshots;
// ---- muxE tools:
// The five existing tools either print a short list of Archive items or list the
// newest few Wayback snapshots. The new ones answer two questions neither asks:
// what a search term actually looks like across the catalogue, and how one URL's
// archived history is distributed over time rather than merely listed.
const ADVANCED = "https://archive.org/advancedsearch.php";
const IA_UA = "archive-org-mcp/1.0";
/**
 * Fetches and returns the body unparsed. The two APIs here differ: advancedsearch
 * always answers JSON and reports its own problems in an `error` field, while the
 * CDX API occasionally answers a non JSON body of its own, so the caller reports
 * what actually came back instead of the fetch layer assuming JSON.
 */
async function iaText(url, seconds) {
    let res;
    try {
        res = await fetch(url, { headers: { "User-Agent": IA_UA }, signal: AbortSignal.timeout(seconds * 1000) });
    }
    catch (e) {
        if (e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError")) {
            throw new ArchiveError(`The Internet Archive did not answer within ${seconds} seconds on this route; its index query is slow for a very widely captured URL, so narrow the year range or lower the limit.`);
        }
        throw new ArchiveError(`The Internet Archive could not be reached: ${e instanceof Error ? e.message : String(e)}`);
    }
    if (!res.ok)
        throw new ArchiveError(`Internet Archive error ${res.status}`);
    const body = await res.text();
    if (body.trim()) {
        try {
            const parsed = JSON.parse(body);
            if (parsed && typeof parsed.error === "string") {
                throw new ArchiveError(`The Internet Archive said: ${parsed.error}`);
            }
        }
        catch (e) {
            if (e instanceof ArchiveError)
                throw e;
            // not JSON, which is the caller's business to report
        }
    }
    return { text: body, contentType: res.headers.get("content-type") ?? "not reported" };
}
async function iaJson(url, seconds) {
    const body = await iaText(url, seconds);
    try {
        return JSON.parse(body.text);
    }
    catch {
        throw new ArchiveError(`The Internet Archive answered ${body.contentType} rather than JSON on this route.`);
    }
}
export async function searchProfile(args) {
    const query = (args?.query ?? "").trim();
    if (!query)
        throw new ArchiveError("Provide search terms.");
    const mediatype = (args?.mediatype ?? "").trim().toLowerCase();
    if (mediatype && !/^[a-z]+$/.test(mediatype))
        throw new ArchiveError("A media type is a single word like software, audio, movies or texts.");
    const limit = Math.max(10, Math.min(Math.floor(Number(args?.limit ?? 200) || 200), 500));
    const q = mediatype ? `(${query}) AND mediatype:${mediatype}` : query;
    const fields = ["identifier", "year", "mediatype", "downloads", "collection", "item_size"].map((f) => `fl[]=${f}`).join("&");
    const url = `${ADVANCED}?q=${encodeURIComponent(q)}&${fields}&rows=${limit}&page=1&output=json`;
    const parsed = (await iaJson(url, 60));
    const docs = parsed.response?.docs ?? [];
    const numFound = typeof parsed.response?.numFound === "number" ? parsed.response.numFound : docs.length;
    if (!docs.length)
        return `The Internet Archive holds nothing matching "${query}"${mediatype ? ` in ${mediatype}` : ""}.`;
    const types = new Map();
    const years = new Map();
    const collections = new Map();
    const downloads = [];
    let withYear = 0;
    for (const d of docs) {
        const type = typeof d.mediatype === "string" ? d.mediatype : "not reported";
        types.set(type, (types.get(type) ?? 0) + 1);
        const year = d.year != null ? String(d.year).slice(0, 4) : "not reported";
        years.set(year, (years.get(year) ?? 0) + 1);
        if (d.year != null)
            withYear += 1;
        for (const c of Array.isArray(d.collection) ? d.collection : [])
            collections.set(String(c), (collections.get(String(c)) ?? 0) + 1);
        if (typeof d.downloads === "number" && Number.isFinite(d.downloads))
            downloads.push(d.downloads);
    }
    const top = (m, n) => [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, n).map(([k, v]) => `${k} (${v})`);
    const lines = [
        `What the Internet Archive holds for "${query}"${mediatype ? ` in ${mediatype}` : ""}:`,
        `  items in the catalogue: ${numFound.toLocaleString("en-US")}`,
        `  items read for this profile: ${docs.length}${numFound > docs.length ? `, so every breakdown below is a sample of the first ${docs.length} and not of all ${numFound.toLocaleString("en-US")}` : ""}`,
    ];
    lines.push(`  media types in the sample: ${top(types, 10).join(", ") || "none reported"}`);
    lines.push(`  items with no year recorded: ${docs.length - withYear} of ${docs.length}`);
    const knownYears = [...years.entries()].filter(([y]) => y !== "not reported").sort((a, b) => b[1] - a[1]);
    lines.push(`  most common years in the sample: ${knownYears.slice(0, 12).map(([y, n]) => `${y} (${n})`).join(", ") || "none reported"}`);
    lines.push(`  distinct collections touched: ${collections.size}`);
    lines.push(`    ${top(collections, 10).join(", ") || "none reported"}`);
    if (downloads.length) {
        const sorted = [...downloads].sort((a, b) => a - b);
        const total = downloads.reduce((a, b) => a + b, 0);
        const median = sorted.length % 2 ? sorted[Math.floor(sorted.length / 2)] : Math.round((sorted[sorted.length - 1] + sorted[sorted.length]) / 2);
        lines.push(`  downloads across the ${downloads.length} item(s) that report it: total ${total.toLocaleString("en-US")}, median ${median.toLocaleString("en-US")}, highest ${sorted[sorted.length - 1].toLocaleString("en-US")}, lowest ${sorted[0].toLocaleString("en-US")}`);
    }
    else {
        lines.push("  no item in the sample reports a download count.");
    }
    lines.push("  every figure above is tallied from the rows the search returned, and the sample size is stated rather than implied.");
    return lines.join("\n");
}

const CDX = 'http://web.archive.org/cdx/search/cdx';
export async function snapshotTimeline(args = {}) {
    const raw = String(args?.url ?? '').trim();
    if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(raw))
        throw new Error('Give a full URL including the scheme, like https://example.com/page.html');
    const limit = Math.min(Math.max(Number(args?.limit ?? 500) || 500, 1), 3000);
    const qs = new URLSearchParams({
        url: raw,
        output: 'json',
        limit: String(limit),
        fl: 'timestamp,original,mimetype,statuscode,digest,length',
    });
    if (args?.from)
        qs.set('from', `${args.from}0101`);
    if (args?.to)
        qs.set('to', `${args.to}1231`);
    const res = await fetch(`${CDX}?${qs}`, {
        headers: { 'User-Agent': 'mrfentmen-archive-org-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(40000),
    });
    if (!res.ok)
        throw new Error(`Wayback CDX returned ${res.status}`);
    const body = (await res.json());
    if (!Array.isArray(body) || body.length < 2)
        throw new Error(`The Wayback Machine has no captures for ${raw} in that window`);
    const [head, ...rows] = body;
    const idx = (name) => head.indexOf(name);
    const ts = idx('timestamp'), mime = idx('mimetype'), code = idx('statuscode'), digest = idx('digest'), len = idx('length');
    const ok = rows.filter((r) => String(r[code]) === '200');
    const digests = new Set(ok.map((r) => r[digest]).filter(Boolean));
    const mimes = new Map();
    let bytes = 0;
    const perYear = new Map();
    for (const r of rows) {
        mimes.set(r[mime], (mimes.get(r[mime]) ?? 0) + 1);
        bytes += Number(r[len] ?? 0);
        const year = String(r[ts]).slice(0, 4);
        perYear.set(year, (perYear.get(year) ?? 0) + 1);
    }
    const topMimes = [...mimes.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    return [
        `${raw} — ${rows.length} capture(s) read`,
        `Successful (200): ${ok.length} · distinct content digests: ${digests.size} · repeats of an archived page: ${ok.length - digests.size}`,
        `Window: ${String(rows[0]?.[ts]).slice(0, 4)} to ${String(rows[rows.length - 1]?.[ts]).slice(0, 4)}`,
        `Payload recorded: ${(bytes / 1048576).toFixed(2)} MB across the captures`,
        `Media types: ${topMimes.map(([m, n]) => `${m} (${n})`).join(', ') || 'none reported'}`,
        '',
        'Captures per year:',
        ...[...perYear.entries()].sort().map(([y, n]) => `${y}: ${n}`),
        '',
        `Oldest: http://web.archive.org/web/${rows[0]?.[ts]}/${raw}`,
    ].join('\n');
}
