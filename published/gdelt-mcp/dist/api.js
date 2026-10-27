const BASE = "https://api.gdeltproject.org/api/v2/doc/doc";
export class GdeltError extends Error {
}
let lastRequest = 0;
async function query(params) {
    const now = Date.now();
    const wait = 5000 - (now - lastRequest);
    if (wait > 0)
        await new Promise((r) => setTimeout(r, wait));
    lastRequest = Date.now();
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(`${BASE}?${qs}`, { signal: AbortSignal.timeout(30000) });
    if (res.status === 429)
        throw new GdeltError("GDELT rate limit hit, wait a few seconds and retry");
    if (!res.ok)
        throw new GdeltError(`GDELT error ${res.status}`);
    const ct = res.headers.get("content-type") ?? "";
    if (ct.includes("json")) {
        const d = await res.json();
        const arts = d.articles ?? [];
        return arts.map((a) => {
            const raw = String(a.seendate ?? "");
            const date = /^\d{14}$/.test(raw)
                ? `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`
                : raw.slice(0, 10);
            return `${date} | ${a.language ?? ""} | ${a.domain ?? ""}\n  ${a.title ?? ""}\n  ${a.url ?? ""}`;
        }).join("\n\n") || "No articles found";
    }
    throw new GdeltError("GDELT returned no JSON data for this query");
}
export async function searchNews(args) {
    const limit = Math.min(args.limit ?? 8, 25);
    const lang = args.language ? ` sourcelang:${args.language}` : "";
    return query({
        query: `${args.query ?? ""}${lang}`,
        mode: "artlist",
        maxrecords: String(limit),
        format: "json",
    });
}
export async function newsByCountry(args) {
    const limit = Math.min(args.limit ?? 8, 25);
    return query({
        query: `${args.country ?? ""} sourcecountry:${(args.country ?? "").slice(0, 2).toUpperCase()}`,
        mode: "artlist",
        maxrecords: String(limit),
        format: "json",
    });
}
// GDELT returns seendate as 20260820T091500Z, a compact form that is not a
// valid date string and must be unpacked by hand.
function seen(article) {
    const raw = String(article.seendate ?? "");
    if (!/^\d{8}T\d{6}Z$/.test(raw)) {
        const loose = /^\d{8}/.exec(raw);
        return loose ? { day: `${loose[0].slice(0, 4)}-${loose[0].slice(4, 6)}-${loose[0].slice(6, 8)}`, stamp: NaN } : null;
    }
    const day = `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
    const stamp = Date.UTC(Number(raw.slice(0, 4)), Number(raw.slice(4, 6)) - 1, Number(raw.slice(6, 8)), Number(raw.slice(9, 11)), Number(raw.slice(11, 13)), Number(raw.slice(13, 15)));
    return { day, stamp };
}
function usableArticles(input) {
    if (!Array.isArray(input))
        return [];
    return input.filter((a) => !!a && typeof a === "object");
}
function tally(rows, field) {
    const out = new Map();
    for (const a of rows) {
        const k = String(a[field] ?? "").trim() || "not reported";
        out.set(k, (out.get(k) ?? 0) + 1);
    }
    return out;
}
const pct = (n, total) => (total > 0 ? `${((n / total) * 100).toFixed(1)}%` : "n/a");
const ranked = (m) => [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
// Concentration is the number that says whether a story is many outlets or one
// outlet's beat, so it is computed once and reused rather than eyeballed.
function herfindahl(counts) {
    const total = counts.reduce((a, b) => a + b, 0);
    if (!total)
        return 0;
    return counts.reduce((acc, n) => acc + (n / total) ** 2, 0);
}
function concentration(counts, total) {
    const top = Math.max(...counts, 0);
    const hhi = herfindahl(counts);
    const share = top / total;
    if (counts.length === 1)
        return "every article came from one source, so this is a single outlet's framing and not corroborated coverage.";
    if (share > 0.5)
        return `${pct(top, total)} of the articles come from the largest single source, so treat this as one outlet's story until other sources are added.`;
    if (hhi > 0.25)
        return `coverage leans heavily on a few sources, with the largest at ${pct(top, total)}, so the range of angles is narrow.`;
    if (counts.length >= 5)
        return `the largest source holds ${pct(top, total)} of ${total} articles across ${counts.length} sources, which is broad coverage rather than an echo.`;
    return `the largest source holds ${pct(top, total)} across only ${counts.length} sources, which is thin coverage.`;
}
function window(articles) {
    const days = articles.map((a) => seen(a)?.day).filter((d) => typeof d === "string").sort();
    return { days, missing: articles.length - days.length };
}
export function source_country_breakdown(args) {
    const articles = usableArticles(args?.articles);
    if (!articles.length)
        return "Pass the articles array from a GDELT mode=artlist response.";
    const q = (args?.label ?? "").trim() || "this search";
    const { days, missing } = window(articles);
    const byCountry = ranked(tally(articles, "sourcecountry"));
    const byLang = ranked(tally(articles, "language"));
    const byDomain = ranked(tally(articles, "domain"));
    const lines = [
        `Where the coverage of "${q}" comes from, across ${articles.length} articles GDELT returned:`,
        `  window: ${days[0] ?? "unknown"} to ${days[days.length - 1] ?? "unknown"}${missing ? `, with ${missing} article(s) carrying no usable date` : ""}.`,
        `  source countries: ${byCountry.length}.`,
    ];
    for (const [c, n] of byCountry)
        lines.push(`    ${String(n).padStart(4)}  ${String(pct(n, articles.length)).padStart(6)}  ${c}`);
    lines.push("");
    lines.push(`  languages: ${byLang.map(([l, n]) => `${l} (${n})`).join(", ")}.`);
    const topDomainShare = byDomain.length ? byDomain[0][1] / articles.length : 0;
    lines.push("");
    lines.push(`  ${concentration(byCountry.map(([, n]) => n), articles.length)}`);
    lines.push(`  On outlets: ${byDomain.length} distinct domain${byDomain.length === 1 ? "" : "s"}, the largest holding ${pct(Math.round(topDomainShare * articles.length), articles.length)} of the articles.`);
    if (byCountry.length === 1) {
        lines.push(`  Every article here is from ${byCountry[0][0]}, which means a search of this wording returned one country's press and nothing else.`);
    }
    lines.push("  GDELT reports sourcecountry as a country name and not as a two letter code, and it is printed here because neither existing tool prints it at all.");
    return lines.join("\n");
}
// Words that carry no story identity once a headline is reduced to a set.
const STOPWORDS = new Set([
    "about", "after", "again", "against", "also", "among", "because", "before", "between",
    "both", "could", "does", "doing", "done", "down", "each", "even", "from", "have",
    "here", "into", "just", "like", "many", "more", "most", "much", "over", "says",
    "said", "shall", "should", "since", "some", "such", "than", "that", "their",
    "them", "then", "there", "these", "they", "this", "those", "under", "very",
    "well", "were", "what", "when", "where", "which", "while", "will", "with",
    "would", "your",
]);
/** A headline reduced to the words that can identify a story. */
function titleTokens(title) {
    return String(title ?? "")
        .toLowerCase()
        .split(/[^a-z0-9']+/)
        .filter((w) => w.length >= 4 && !STOPWORDS.has(w));
}
