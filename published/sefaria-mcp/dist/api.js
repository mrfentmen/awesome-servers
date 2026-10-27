const UA = 'mrfentmen-sefaria-mcp/1.0';
export async function getText(args) {
    const ref = (args.ref ?? '').trim();
    if (!ref)
        return 'Provide a ref like Genesis.1.';
    const res = await fetch(`https://www.sefaria.org/api/texts/${encodeURIComponent(ref)}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`Sefaria returned ${res.status}`);
    const d = (await res.json());
    const flatten = (t) => t.map((x) => (Array.isArray(x) ? x.join(' ') : x)).join(' ');
    const body = Array.isArray(d.text) ? flatten(d.text).slice(0, 400) : 'n/a';
    return [
        `Sefaria ${d.ref ?? ref}${d.heRef ? ` (${d.heRef})` : ''}:`,
        body,
    ].filter(Boolean).join('\n');
}
// ---- muxF tools:
const SEFARIA_API = 'https://www.sefaria.org/api';
function sefariaGet(path) {
    return fetch(`${SEFARIA_API}${path}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    }).then(async (res) => {
        if (!res.ok)
            throw new Error(`Sefaria returned ${res.status}`);
        return (await res.json());
    });
}
function clip(value, chars) {
    const text = typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
    if (!text)
        return 'not reported';
    return text.length > chars ? `${text.slice(0, chars)}...` : text;
}
function authorsOf(index) {
    const raw = index.authors ?? [];
    const names = raw.map((a) => (typeof a === 'string' ? a : a.en ?? a.he ?? '')).filter(Boolean);
    return names.length ? names.slice(0, 8).join(', ') : 'not reported';
}
/** What Sefaria's index says about a book: description, dating, categories and alternate titles. */
export async function bookDigest(args) {
    const book = (args.book ?? '').trim();
    if (!book)
        return 'Provide a book name like Genesis or Shabbat.';
    const d = await sefariaGet(`/v2/index/${encodeURIComponent(book)}`);
    if (d.error)
        throw new Error(String(d.error));
    return [
        `${d.title ?? book}${d.heTitle ? ` / ${d.heTitle}` : ''}`,
        `Categories: ${d.categories?.length ? d.categories.join(' > ') : 'not reported'}`,
        `Corpus: ${d.corpora?.length ? d.corpora.join(', ') : 'not reported'}`,
        `Authors: ${authorsOf(d)}`,
        `Composed: ${clip(d.compDateString?.en ?? (Array.isArray(d.compDate) ? d.compDate.join(' to ') : ''), 80)}${d.compPlace ? ` in ${d.compPlace}` : ''}`,
        `First published: ${clip(d.pubDateString?.en ?? (Array.isArray(d.pubDate) ? d.pubDate.join(', ') : ''), 80)}${d.pubPlace ? ` in ${d.pubPlace}` : ''}`,
        `Cited elsewhere on Sefaria: ${d.is_cited === undefined ? 'not reported' : d.is_cited ? 'yes' : 'no'}`,
        `Textual variants flagged: ${d.hasErrorMargin === undefined ? 'not reported' : d.hasErrorMargin ? 'yes' : 'no'}`,
        `English titles: ${d.titleVariants?.length ? d.titleVariants.slice(0, 10).join(', ') : 'not reported'}`,
        `Hebrew titles: ${d.heTitleVariants?.length ? d.heTitleVariants.slice(0, 6).join(', ') : 'not reported'}`,
        `Description: ${clip(d.enDesc ?? d.enShortDesc, 700)}`,
    ].join('\n');
}
