const ALQURAN_BASE = 'https://api.alquran.cloud/v1';
const QURANCOM_BASE = 'https://api.quran.com/api/v4';
const UA = 'mrfentmen-quran-mcp/1.0 (https://github.com/mrfentmen)';
export class QuranError extends Error {
}
async function get(url) {
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(25000) });
    if (res.status === 429)
        throw new QuranError('Quran API rate limit hit, wait and retry');
    if (!res.ok)
        throw new QuranError(`Quran API error ${res.status}`);
    return (await res.json());
}
export async function verse(args) {
    const chapter = args.chapter;
    const verseNum = args.verse;
    if (chapter === undefined || verseNum === undefined || chapter < 1 || chapter > 114 || verseNum < 1) {
        throw new QuranError('Provide a chapter (1 to 114) and verse number');
    }
    const d = await get(`${ALQURAN_BASE}/ayah/${chapter}:${verseNum}/editions/quran-uthmani,en.asad`);
    const editions = d?.data ?? [];
    const ar = editions.find((e) => e?.edition?.identifier === 'quran-uthmani');
    const en = editions.find((e) => e?.edition?.identifier === 'en.asad');
    return `${ar?.text ?? ''}\n\n${en?.text ?? 'no translation'}\n\nSurah ${chapter}:${verseNum} (${en?.surah?.englishName ?? ''})`;
}
export async function surahInfo(args) {
    const chapter = args.chapter;
    if (chapter === undefined || chapter < 1 || chapter > 114)
        throw new QuranError('Provide a chapter number 1 to 114');
    const d = await get(`${ALQURAN_BASE}/surah/${chapter}/en.asad`);
    const s = d?.data ?? {};
    return `Surah ${s.number}: ${s.englishName} (${s.name})\nRevelation: ${s.revelationType ?? 'n/a'} | Verses: ${s.numberOfAyahs ?? 'n/a'}\n\n${(s.ayahs ?? []).slice(0, 3).map((a) => `${a.numberInSurah}. ${a.text}`).join('\n')}${(s.ayahs?.length ?? 0) > 3 ? `\n... and ${s.ayahs.length - 3} more verses` : ''}`;
}
export async function chapters(_args = {}) {
    const d = await get(`${QURANCOM_BASE}/chapters?language=en`);
    const chapters = d.chapters ?? [];
    if (!chapters.length)
        return 'No chapters returned.';
    return `Quran.com chapters (${chapters.length}):\n` +
        chapters.map((c, i) => `${i + 1}. ${c.id ?? '?'}. ${c.name_simple ?? '?'} (${c.name_arabic ?? ''}) ${c.verses_count ?? '?'} verses [${c.revelation_place ?? ''}]`.trim()).join('\n');
}
export async function chapter(args) {
    const id = Number(args.id);
    if (!Number.isFinite(id) || id <= 0)
        return 'Provide a chapter id.';
    const d = await get(`${QURANCOM_BASE}/chapters/${id}?language=en`);
    const c = d.chapter ?? {};
    return [
        `Quran chapter ${c.id ?? id}: ${c.name_simple ?? '?'} (${c.name_arabic ?? ''})`,
        `Translated: ${c.translated_name?.name ?? '?'}`,
        `${c.verses_count ?? '?'} verses | ${c.revelation_place ?? '?'}`,
        c.pages ? `Pages: ${c.pages[0]}-${c.pages[1]}` : null,
    ].filter(Boolean).join('\n');
}
// ---- muxE tools:
// The four existing tools read one verse, one chapter's first three verses, the
// chapter list and one chapter's card. Between them they never surface where a
// verse sits in the traditional reading structure, which chapter was revealed
// when, or what falls on a page of a printed mushaf. Those are three other
// questions on routes these two APIs already answer, all verified live.
const JUZ_META = 'https://api.quran.com/api/v4';
const STRUCT = 'https://api.alquran.cloud/v1';
async function qget(url) {
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(25000) });
    if (res.status === 429)
        throw new QuranError('Quran API rate limit hit, wait and retry');
    if (!res.ok)
        throw new QuranError(`Quran API error ${res.status}`);
    return (await res.json());
}
// A chapter is 1 to 114 and a verse is 1 to 286, so both are bounded here
// before a request is made rather than after it fails.
function bounds(chapter, verse) {
    const c = Number(chapter);
    if (!Number.isFinite(c) || c < 1 || c > 114)
        throw new QuranError('Provide a chapter number 1 to 114');
    if (verse === undefined || verse === null || verse === '')
        return { c };
    const v = Number(verse);
    if (!Number.isFinite(v) || v < 1 || v > 286)
        throw new QuranError('Provide a verse number 1 to 286');
    return { c, v };
}
const text = (v, max) => {
    if (typeof v !== 'string' || !v)
        return 'not reported';
    const t = v.replace(/\s+/g, ' ').trim();
    return t.length > max ? `${t.slice(0, max)}...` : t;
};
export async function page_verses(args) {
    const p = Number(args?.page);
    // A standard mushaf is 604 pages, which is what the API is paged by.
    if (!Number.isFinite(p) || p < 1 || p > 604)
        throw new QuranError('Provide a mushaf page number 1 to 604');
    const limit = Math.max(1, Math.min(20, Math.floor(Number(args?.limit ?? 10) || 10)));
    const d = await qget(`${STRUCT}/page/${p}/quran-uthmani`);
    const data = d?.data ?? {};
    const ayahs = Array.isArray(data.ayahs) ? data.ayahs : [];
    const surahs = (Array.isArray(data.surahs) ? data.surahs : []);
    if (!ayahs.length)
        return `Page ${p} returned no verses.`;
    const rows = ayahs;
    const bySurah = new Map();
    for (const a of rows) {
        const key = `${a.surah?.number ?? '?'}: ${a.surah?.englishName ?? a.surah?.name ?? 'not reported'}`;
        bySurah.set(key, [...(bySurah.get(key) ?? []), a]);
    }
    const words = rows.reduce((acc, a) => acc + ((String(a.text ?? '').match(/\S+/g) ?? []).length), 0);
    const lines = [
        `Mushaf page ${p}, which carries ${ayahs.length} verse${ayahs.length === 1 ? '' : 's'} and about ${words} words across ${bySurah.size} surah${bySurah.size === 1 ? '' : 's'}:`,
        `  surahs on this page: ${surahs.map((s) => `${s.number ?? '?'} ${s.englishName ?? s.name ?? 'not reported'}`).join(', ') || 'not reported'}.`,
        "",
    ];
    for (const [key, list] of bySurah) {
        lines.push(`  ${key} — verses ${list[0].numberInSurah} to ${list[list.length - 1].numberInSurah}:`);
        for (const a of list.slice(0, limit)) {
            lines.push(`    ${a.numberInSurah}. ${text(a.text, 160)}`);
        }
        if (list.length > limit)
            lines.push(`    and ${list.length - limit} further verse(s) on this page from this surah.`);
    }
    if (ayahs.length > limit * bySurah.size) {
        lines.push(`  ${ayahs.length} verses in all; raise limit to see the rest of the page.`);
    }
    return lines.join('\n');
}
// ---- gap3b tools:
// The six existing tools are all text: one verse, a chapter's first verses,
// the chapter list, a chapter card, a verse's reading structure, revelation
// order and a mushaf page. None of them touch the audio the recitation routes
// serve, so this reaches the one thing about a chapter that is heard rather
// than read.
const AUDIO_BASE = 'https://verses.quran.com';
