const BASE = 'https://api.wikimedia.org/feed/v1/wikipedia/en';
const UA = 'mrfentmen-wikitrending-mcp/1.0 (test@example.com)';
function today() {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}/${m}/${day}`;
}
function normDate(date) {
    const s = (date ?? '').trim();
    if (/^\d{4}\/\d{2}\/\d{2}$/.test(s))
        return s;
    if (/^\d{4}-\d{2}-\d{2}$/.test(s))
        return s.replace(/-/g, '/');
    return today();
}
async function getFeed(date) {
    const res = await fetch(`${BASE}/featured/${date}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`Wikimedia returned ${res.status}`);
    return (await res.json());
}
export async function featured(args) {
    const date = normDate(args?.date);
    const feed = await getFeed(date);
    const tfa = (feed.tfa ?? {});
    if (!tfa.title)
        return `No featured article for ${date}.`;
    return [
        `Wikipedia featured article for ${date}:`,
        `Title: ${tfa.title}`,
        tfa.description ? `Description: ${tfa.description}` : null,
        tfa.extract ? `Extract: ${tfa.extract.slice(0, 400)}` : null,
        tfa.content_urls?.desktop?.page ? `Link: ${tfa.content_urls.desktop.page}` : null,
    ].filter(Boolean).join('\n');
}
export async function mostread(args) {
    const date = normDate(args?.date);
    const limit = Math.min(Math.max(Number(args?.limit ?? 10) || 10, 1), 25);
    const feed = await getFeed(date);
    const mr = (feed.mostread ?? {});
    const articles = mr.articles ?? [];
    if (!articles.length)
        return `No most-read data for ${date}.`;
    const rows = articles.slice(0, limit).map((a, i) => `${i + 1}. ${a.normalizedtitle ?? a.title ?? '?'} (${a.views ?? '?'} views)`);
    return `Wikipedia most-read for ${date} (top ${rows.length}):\n${rows.join('\n')}`;
}
function viewDates(args) {
    const parse = (value) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
            throw new Error('Dates must use YYYY-MM-DD.');
        const time = Date.parse(`${value}T00:00:00Z`);
        if (!Number.isFinite(time) || new Date(time).toISOString().slice(0, 10) !== value)
            throw new Error('Invalid calendar date.');
        return time;
    };
    const start = parse(args.start);
    const end = parse(args.end);
    if (end < start || end - start > 30 * 86400000)
        throw new Error('Choose an inclusive range of 1-31 days.');
    return `${args.start.replace(/-/g, '')}00/${args.end.replace(/-/g, '')}00`;
}
async function viewSeries(path, label) {
    const res = await fetch(`https://wikimedia.org/api/rest_v1/metrics/pageviews/${path}`, {
        headers: { 'User-Agent': 'mrfentmen-wikitrending-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Wikimedia pageviews returned ${res.status}`);
    const data = await res.json();
    const rows = data.items ?? [];
    if (!rows.length)
        return 'No pageview observations returned.';
    return `${label} (daily user pageviews across all access methods):\n` + rows.slice(0, 31).map(row => `${row.timestamp?.slice(0, 8) ?? 'date not reported'}: ${row.views ?? 'not reported'} views`).join('\n');
}
export async function projectPageviews(args) {
    return viewSeries(`aggregate/en.wikipedia/all-access/user/daily/${viewDates(args)}`, 'English Wikipedia');
}
