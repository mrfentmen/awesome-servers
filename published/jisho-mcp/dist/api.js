/**
 * Jisho.org API v1 client — Japanese-English dictionary.
 * Docs: https://jisho.org/forum/54fefc1f6e71740b1f000000 (unofficial)
 * Endpoints: /api/v1/search/words?keyword=... and /api/v1/search/sentences?keyword=...
 */
const BASE = "https://jisho.org/api/v1/search";
export class JishoError extends Error {
}
async function search(kind, keyword) {
    const res = await fetch(`${BASE}/${kind}?keyword=${encodeURIComponent(keyword)}`, {
        headers: { Accept: "application/json", "User-Agent": "jisho-mcp/1.0" },
    });
    if (!res.ok)
        throw new JishoError(`Jisho API error ${res.status}: ${res.statusText}`);
    const data = (await res.json());
    return data.data ?? [];
}
export async function searchWords(keyword, limit = 10) {
    const results = await search("words", keyword);
    return results.slice(0, limit).map((r) => ({
        slug: r.slug,
        isCommon: r.is_common,
        jlpt: r.jlpt ?? [],
        tags: r.tags ?? [],
        japanese: r.japanese ?? [],
        senses: (r.senses ?? []).map((s) => ({
            englishDefinitions: s.english_definitions ?? [],
            partsOfSpeech: s.parts_of_speech ?? [],
            tags: s.tags ?? [],
            seeAlso: s.see_also ?? [],
        })),
    }));
}
/**
 * Tag/feature searches the words endpoint supports: "#common", "jlpt-n5",
 * "wanikani10", English meanings, etc.
 */
export async function searchByTag(keyword, limit = 10) {
    const results = await search("words", keyword);
    return results.slice(0, limit).map((r) => ({
        slug: r.slug,
        isCommon: r.is_common,
        jlpt: r.jlpt ?? [],
        tags: r.tags ?? [],
        japanese: r.japanese ?? [],
        senses: (r.senses ?? []).map((s) => ({
            englishDefinitions: s.english_definitions ?? [],
            partsOfSpeech: s.parts_of_speech ?? [],
            tags: s.tags ?? [],
            seeAlso: s.see_also ?? [],
        })),
    }));
}
// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------
export function formatWord(w, index = 0) {
    const head = w.japanese
        .map((j) => `${j.word ?? ""}${j.reading ? ` (${j.reading})` : ""}`.trim())
        .filter(Boolean)
        .join(" / ");
    const lines = [`${index > 0 ? `${index}. ` : ""}${head || w.slug}`];
    const firstSense = w.senses[0];
    if (firstSense) {
        const pos = firstSense.partsOfSpeech.length ? ` [${firstSense.partsOfSpeech.join(", ")}]` : "";
        const defs = firstSense.englishDefinitions.slice(0, 4).join("; ");
        lines.push(`   ${defs}${pos}`);
    }
    if (w.isCommon)
        lines[lines.length - 1] += " ⭐common";
    if (w.jlpt.length)
        lines.push(`   JLPT: ${w.jlpt.join(", ")}`);
    if (w.senses.length > 1) {
        lines.push(`   (+${w.senses.length - 1} more senses)`);
    }
    return lines.join("\n");
}
