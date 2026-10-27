const BASE = 'https://opml.radiotime.com';
const UA = 'mrfentmen-tunein-mcp/1.0';
export async function browse(_args) {
    const res = await fetch(`${BASE}/Browse.ashx?c=local`, {
        headers: { 'User-Agent': UA, Accept: 'application/xml' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`TuneIn returned ${res.status}`);
    const text = await res.text();
    if (!text.includes('<outline'))
        return 'No TuneIn categories returned.';
    const items = [...text.matchAll(/<outline\s+[^>]*text="([^"]*)"[^>]*\/>/g)]
        .map((m) => m[1])
        .filter(Boolean);
    return `TuneIn radio categories (${items.length}):\n${items.slice(0, 30).map((t, i) => `${i + 1}. ${t}`).join('\n')}`;
}
// ---- muxF tools:
const OPML = 'https://opml.radiotime.com';
const CATEGORIES = ['local', 'music', 'talk', 'sports'];
async function opml(query) {
    const res = await fetch(`${OPML}/Browse.ashx?${query}`, {
        headers: { 'User-Agent': UA, Accept: 'application/xml' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`TuneIn returned ${res.status} for ${query}`);
    const xml = await res.text();
    if (!xml.includes('<outline'))
        throw new Error(`TuneIn returned no outline for ${query}`);
    const title = /<title>([^<]*)<\/title>/.exec(xml)?.[1]?.trim() ?? 'title not reported';
    return { title, xml };
}
function attrs(tag) {
    const out = {};
    const re = /([A-Za-z_][\w.-]*)="([^"]*)"/g;
    let m;
    while ((m = re.exec(tag)) !== null)
        if (m[1])
            out[m[1]] = m[2];
    return out;
}
function unescapeXml(value) {
    return value
        .replace(/&apos;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .trim();
}
function stationsOf(xml) {
    const out = [];
    for (const m of xml.matchAll(/<outline\s+[^>]*type="audio"[^>]*\/>/g)) {
        const a = attrs(m[0]);
        if (!a.guide_id)
            continue;
        out.push({
            name: unescapeXml(a.text ?? ''),
            guideId: a.guide_id,
            bitrate: a.bitrate ?? '',
            reliability: a.reliability ?? '',
            formats: a.formats ?? '',
            genreId: a.genre_id ?? '',
            subtext: unescapeXml(a.subtext ?? ''),
            nowPlaying: unescapeXml(a.playing ?? ''),
            url: a.URL ?? `http://opml.radiotime.com/Tune.ashx?id=${a.guide_id}`,
        });
    }
    return out;
}
function categoriesOf(xml) {
    const out = [];
    for (const m of xml.matchAll(/<outline\s+[^>]*type="link"[^>]*\/>/g)) {
        const a = attrs(m[0]);
        if (!a.guide_id)
            continue;
        out.push({ label: unescapeXml(a.text ?? ''), guideId: a.guide_id, url: a.URL ?? `${OPML}/Browse.ashx?id=${a.guide_id}` });
    }
    return out;
}
function tally(map, cap) {
    if (!map.size)
        return 'not reported';
    return [...map.entries()]
        .sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])))
        .slice(0, cap)
        .map(([k, n]) => `${k} ${n}`)
        .join(', ');
}
async function stationsFor(section) {
    const cleaned = section.trim();
    if (!cleaned)
        throw new Error('Provide a section name, either a category like local, or a guide id like g22.');
    if (/^(g|c|s)\d+$/i.test(cleaned)) {
        const { title, xml } = await opml(`id=${encodeURIComponent(cleaned)}`);
        return { title, stations: stationsOf(xml) };
    }
    const { title, xml } = await opml(`c=${encodeURIComponent(cleaned)}`);
    return { title, stations: stationsOf(xml) };
}
/** The genre and subcategory taxonomy, with the TuneIn guide id and browse URL behind each entry. */
export async function genreIndex(args) {
    const limit = Math.max(1, Math.min(Math.floor(args.limit ?? 12), 40));
    const found = [];
    const direct = [];
    for (const category of CATEGORIES) {
        const { title, xml } = await opml(`c=${category}`);
        const entries = categoriesOf(xml);
        const stations = stationsOf(xml);
        if (entries.length)
            found.push({ category, title, entries });
        if (stations.length)
            direct.push({ category, title, stations });
    }
    const total = found.reduce((sum, f) => sum + f.entries.length, 0);
    if (!found.length && !direct.length)
        return 'TuneIn returned no category or subcategory entries for the standard categories.';
    const lines = [
        `TuneIn browse taxonomy across ${CATEGORIES.join(', ')}`,
        `Categories that expose subcategories: ${found.length}, holding ${total} subcategory link(s)`,
    ];
    for (const f of found) {
        lines.push(`${f.category} (titled "${f.title}"): ${f.entries.length} subcategory link(s)`);
        for (const e of f.entries.slice(0, limit))
            lines.push(`  - ${e.label} (${e.guideId}) ${e.url}`);
        if (f.entries.length > limit)
            lines.push(`  ... and ${f.entries.length - limit} more in ${f.category}.`);
    }
    for (const d of direct) {
        lines.push(`${d.category} (titled "${d.title}"): ${d.stations.length} station(s) listed directly, in the sections ${[...new Set(d.stations.map((s) => s.guideId))].length ? 'grouped by band' : 'with no grouping'}`);
        const sample = d.stations.slice(0, limit);
        for (const s of sample)
            lines.push(`  - ${s.name} (${s.guideId}) ${s.bitrate} kbps`);
        if (d.stations.length > limit)
            lines.push(`  ... and ${d.stations.length - limit} more stations.`);
    }
    lines.push(`A subcategory guide id such as g22 or c100000215 can be handed straight to station_search to list the stations behind it.`);
    return lines.join('\n');
}
