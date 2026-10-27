// ---- muxE tools:
// The five existing tools answer what a term means, what matches a string, what
// is in a block of text, one random term and the vibe tally. The two new tools
// work on the same local lexicon in two directions none of those take: when the
// vocabulary arrived, and which terms actually reference each other.
import { LEXICON } from "./lexicon.js";
const YEAR = /\b((?:19|20)\d{2})\b/;
const DECADE = /\b((?:19|20)\d{2})s\b/;
function originYears(entry) {
    const text = `${entry.origin} ${entry.meaning}`;
    return {
        years: [...text.matchAll(new RegExp(YEAR, "g"))].map((m) => Number(m[1])),
        decades: [...text.matchAll(new RegExp(DECADE, "g"))].map((m) => Number(m[1])),
    };
}
export async function originTimeline(_args = {}) {
    if (!LEXICON.length)
        return "The lexicon is empty.";
    const dated = [];
    const decadeOnly = [];
    const undated = [];
    for (const entry of LEXICON) {
        const { years, decades } = originYears(entry);
        if (years.length) {
            const earliest = Math.min(...years);
            dated.push({ entry, year: earliest });
        }
        else if (decades.length) {
            decadeOnly.push({ entry, decade: Math.min(...decades) });
        }
        else {
            undated.push(entry.term);
        }
    }
    if (!dated.length)
        return "No entry in the lexicon states a year in its origin or meaning.";
    dated.sort((a, b) => a.year - b.year || a.entry.term.localeCompare(b.entry.term));
    decadeOnly.sort((a, b) => a.decade - b.decade || a.entry.term.localeCompare(b.entry.term));
    const tally = new Map();
    for (const row of dated)
        tally.set(row.year, (tally.get(row.year) ?? 0) + 1);
    const lines = [
        `When this vocabulary arrived, read out of the ${LEXICON.length} lexicon entries:`,
        `  entries naming a specific year: ${dated.length}`,
        `  entries naming only a decade: ${decadeOnly.length}`,
        `  entries naming no date at all: ${undated.length}`,
    ];
    const first = dated[0];
    const last = dated[dated.length - 1];
    lines.push(`  earliest dated term: ${first.entry.term} (${first.year})`, `  most recent dated term: ${last.entry.term} (${last.year})`);
    lines.push("  dated terms by year, earliest first:");
    for (const [year, n] of [...tally.entries()].sort((a, b) => a[0] - b[0])) {
        const names = dated.filter((r) => r.year === year).map((r) => r.entry.term);
        lines.push(`    ${year}: ${n} term(s) - ${names.join(", ")}`);
    }
    if (decadeOnly.length) {
        lines.push("  terms that only give a decade:");
        const decades = [...new Set(decadeOnly.map((r) => r.decade))].sort((a, b) => a - b);
        for (const decade of decades) {
            lines.push(`    ${decade}s: ${decadeOnly.filter((r) => r.decade === decade).map((r) => r.entry.term).join(", ")}`);
        }
    }
    if (undated.length)
        lines.push(`  terms with no date in their origin or meaning: ${undated.join(", ")}`);
    lines.push("  a term is dated by the earliest year its origin or meaning states, so an entry can carry several.");
    return lines.join("\n");
}
// ---- gap3d tools:
// The lexicon ships in this package and this server makes no network calls, so
// this tool reads the same local LEXICON the other tools do. What it adds is a
// different question again: search_terms is a substring filter and
// related_terms is an exact-mention graph, so neither answers "which entries
// are worded most like this one".
/** Content words of an entry, stop words dropped, lowercased and stemmed. */
function simTokens(entry) {
    const stop = new Set([
        'a', 'an', 'and', 'are', 'as', 'at', 'be', 'been', 'but', 'by', 'for', 'from',
        'has', 'have', 'in', 'into', 'is', 'it', 'its', 'means', 'of', 'on', 'or', 'so',
        'that', 'the', 'then', 'this', 'to', 'was', 'were', 'which', 'with', 'you',
    ]);
    const out = new Map();
    const text = `${entry.term} ${entry.meaning} ${entry.origin} ${entry.example}`.toLowerCase();
    for (const word of text.replace(/[^a-z0-9'\s-]/g, ' ').split(/\s+/)) {
        const clean = word.replace(/^[-']+|[-']+$/g, '');
        if (clean.length < 3 || stop.has(clean))
            continue;
        // A crude suffix fold so "raiding" and "raid" count as the same word. It is
        // a similarity aid, not morphology, and the report says so.
        const stem = clean.length > 5 ? clean.replace(/(?:ing|ers?|ies|ed|es|s)$/, '') : clean;
        const key = stem.length >= 3 ? stem : clean;
        out.set(key, (out.get(key) ?? 0) + 1);
    }
    return out;
}
