const BASE = 'https://developer.mozilla.org/api/v1/search';
export async function search(args) {
    const q = (args.query ?? '').trim();
    if (!q)
        return 'Provide a search query.';
    const limit = Math.max(1, Math.min(args.limit ?? 10, 30));
    const url = `${BASE}?q=${encodeURIComponent(q)}&locale=en-US&highlight=false&limit=${limit}`;
    const res = await fetch(url, {
        headers: { 'User-Agent': 'mrfentmen-mdn-search-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`MDN search returned ${res.status}`);
    const data = (await res.json());
    const rows = (data.documents ?? []).filter((d) => d && d.title);
    if (!rows.length)
        return `No MDN docs found for "${q}".`;
    return `MDN results for "${q}" (${rows.length} shown):\n` + rows.map((d, i) => `${i + 1}. ${d.title}\n   ${(d.summary ?? '').slice(0, 160)}${d.mdn_url ? `\n   https://developer.mozilla.org${d.mdn_url}` : ''}`).join('\n');
}
// ---- muxF tools:
const MDN = 'https://developer.mozilla.org';
async function mdnSearch(q, locale) {
    const url = `${MDN}/api/v1/search?q=${encodeURIComponent(q)}&locale=${encodeURIComponent(locale)}&highlight=true&limit=10`;
    const res = await fetch(url, {
        headers: { 'User-Agent': 'mrfentmen-mdn-search-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`MDN search returned ${res.status} for locale ${locale}`);
    return (await res.json());
}
function topSection(hit) {
    const first = String(hit.slug ?? '').split('/')[0];
    if (!first)
        return 'not reported';
    return first.replace(/_/g, ' ');
}
/** Where a term actually lives on MDN, and which of the top-level sections came back empty. */
export async function sectionCensus(args) {
    const q = (args.query ?? '').trim();
    if (!q)
        return 'Provide a search query.';
    const locales = (args.locales ?? 'en-US').split(/[,\s]+/).map((l) => l.trim()).filter(Boolean).slice(0, 4);
    const perLocale = [];
    for (const locale of locales) {
        const data = await mdnSearch(q, locale);
        perLocale.push({ locale, hits: (data.documents ?? []).filter((d) => d && d.title), total: data.metadata?.total?.value });
    }
    const allHits = perLocale.flatMap((entry) => entry.hits);
    if (!allHits.length)
        return `No MDN document in ${locales.join(', ')} matches "${q}".`;
    const sections = new Map();
    for (const hit of allHits) {
        const section = topSection(hit);
        const score = typeof hit.score === 'number' ? hit.score : -Infinity;
        const current = sections.get(section);
        if (!current) {
            sections.set(section, { count: 1, best: hit, bestScore: score });
        }
        else {
            current.count += 1;
            if (score > current.bestScore) {
                current.best = hit;
                current.bestScore = score;
            }
        }
    }
    const ranked = [...sections.entries()].sort((a, b) => b[1].bestScore - a[1].bestScore);
    const known = new Set(['learn web development', 'web', 'glossary', 'mozilla']);
    const missing = [...known].filter((k) => !sections.has(k));
    const titles = new Map();
    for (const hit of allHits) {
        const key = String(hit.title ?? '').toLowerCase();
        titles.set(key, (titles.get(key) ?? 0) + 1);
    }
    const shared = [...titles.entries()].filter(([, n]) => n > 1);
    return [
        `Where "${q}" lives on MDN, across ${locales.length} locale(s)`,
        ...perLocale.map((e) => `- ${e.locale}: ${e.hits.length} hit(s) returned, ${e.total ?? 'total not reported'} in the index`),
        `Top-level sections carrying hits (${ranked.length}):`,
        ...ranked.map(([section, info]) => `- ${section}: ${info.count} hit(s); best is "${info.best.title ?? 'title not reported'}" at ${typeof info.best.score === 'number' ? info.best.score.toFixed(2) : 'score not reported'} (${info.best.locale ?? 'locale not reported'})`),
        missing.length ? `Sections that returned nothing: ${missing.join(', ')}` : 'Every common MDN section returned something.',
        shared.length
            ? `Titles shared by more than one hit: ${shared.slice(0, 5).map(([t, n]) => t + ' (' + n + ')').join(', ')}, which usually means a reference page and a glossary entry both exist.`
            : 'No two hits share a title, so this term maps to a single MDN page per locale.',
        'Section names come from the first path segment of each result slug, so they reflect MDN own information architecture.',
    ].join('\n');
}
