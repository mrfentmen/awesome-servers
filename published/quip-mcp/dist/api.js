export class QuipError extends Error {
    constructor(message) {
        super(message);
        this.name = "QuipError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
function envStrict(name) {
    const v = process.env[name];
    if (!v)
        throw new QuipError(`Set the ${name} environment variable.`);
    return v;
}
async function authHeaders() {
    return { Authorization: "Bearer " + envStrict("QUIP_API_TOKEN") };
}
function pretty(data) {
    const t = typeof data === "string" ? data : JSON.stringify(data, null, 2);
    return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t;
}
async function req(url, init = {}) {
    const res = await fetch(url, { signal: AbortSignal.timeout(30000), headers: { ...UA, ...(await authHeaders()), ...(init.headers ?? {}) }, ...init });
    const ct = res.headers.get("content-type") ?? "";
    const data = ct.includes("json") ? await res.json() : await res.text();
    if (!res.ok) {
        const detail = typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300);
        throw new QuipError(`HTTP ${res.status}: ${detail}`);
    }
    return data;
}
export async function searchThreads(query) {
    let url = `https://platform.quip.com/1/threads/search`;
    const qs = new URLSearchParams();
    qs.append("query", String(query));
    const qstr = qs.toString();
    if (qstr)
        url += (url.includes('?') ? '&' : '?') + qstr;
    const data = await req(url);
    return pretty(data);
}
export async function getThread(threadId) {
    let url = `https://platform.quip.com/1/threads/${encodeURIComponent(String(threadId))}`;
    const data = await req(url);
    return pretty(data);
}
export async function listFolders() {
    let url = `https://platform.quip.com/1/folders`;
    const data = await req(url);
    return pretty(data);
}
export async function getUser() {
    let url = `https://platform.quip.com/1/users/current`;
    const data = await req(url);
    return pretty(data);
}
/**
 * How a document actually reads: word and sentence counts, a Flesch reading
 * ease and Flesch-Kincaid grade, the heading count, the links it carries and the
 * longest sentence in it. Runs entirely on the text supplied.
 */
export async function documentProfile(args) {
    const raw = (args.text ?? "").trim();
    if (!raw)
        throw new QuipError("Give the document text to profile.");
    const capped = raw.slice(0, 500000);
    const words = capped.match(/[A-Za-z0-9'’-]+/g) ?? [];
    const sentences = capped.split(/[.!?]+(?:\s|$)/).map((s) => s.trim()).filter((s) => s.split(/\s+/).filter(Boolean).length > 0);
    const paragraphs = capped.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
    const headings = capped.split("\n").filter((l) => /^\s{0,3}#{1,6}\s+\S/.test(l));
    const links = [...capped.matchAll(/\[[^\]]*\]\(([^)\s]+)/g)].map((m) => m[1]);
    const syllableCount = (word) => {
        const w = word.toLowerCase().replace(/[^a-z]/g, "");
        if (w.length <= 2)
            return 1;
        const trimmed = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, "");
        const groups = trimmed.match(/[aeiouy]{1,2}/g);
        return Math.max(1, groups ? groups.length : 1);
    };
    const syllables = words.reduce((sum, word) => sum + syllableCount(word), 0);
    const wordCount = words.length;
    const sentenceCount = Math.max(sentences.length, 1);
    const flesch = 206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (syllables / Math.max(wordCount, 1));
    const grade = 0.39 * (wordCount / sentenceCount) + 11.8 * (syllables / Math.max(wordCount, 1)) - 15.59;
    const longestWord = words.reduce((a, b) => (b.length > a.length ? b : a), "");
    const longestSentence = Math.max(...sentences.map((s) => s.split(/\s+/).filter(Boolean).length), 0);
    const stats = {
        words: wordCount,
        sentences: sentenceCount,
        paragraphs: paragraphs.length,
        headings: headings.length,
        links: links.length,
        flesch: Math.round(flesch * 10) / 10,
        grade: Math.round(grade * 10) / 10,
        longestWord,
        longestSentence,
    };
    const ease = (value) => value >= 90 ? "very easy, roughly a 5th grader" : value >= 80 ? "easy, roughly a 6th grader" : value >= 70 ? "fairly easy, roughly a 7th grader" : value >= 60 ? "plain English, roughly an 8th to 9th grader" : value >= 50 ? "fairly difficult, roughly a 10th to 12th grader" : value >= 30 ? "difficult, roughly a college student" : "very difficult, above college";
    const findings = [];
    if (stats.words / sentenceCount > 25)
        findings.push(`sentences average ${(stats.words / sentenceCount).toFixed(1)} words, so the document is dense`);
    if (stats.longestSentence > 45)
        findings.push(`the longest sentence runs ${stats.longestSentence} words`);
    if (stats.words > 0 && stats.words / Math.max(stats.paragraphs, 1) > 120)
        findings.push("paragraphs average over 120 words each, which reads as a wall");
    if (stats.headings === 0 && stats.words > 300)
        findings.push("no markdown headings at all, so the document has no navigable structure");
    if (stats.links > 0) {
        const unique = new Set(links).size;
        if (unique < stats.links / 2)
            findings.push(`only ${unique} distinct link target(s) behind ${stats.links} links, so much of the linking is repeated`);
    }
    return [
        `Document profile (${capped.length.toLocaleString()} characters supplied)`,
        `  ${stats.words.toLocaleString()} words | ${stats.sentences.toLocaleString()} sentences | ${stats.paragraphs.toLocaleString()} paragraphs | ${stats.headings} markdown heading(s) | ${stats.links} link(s)`,
        `  ${(stats.words / sentenceCount).toFixed(1)} words per sentence, ${(syllables / Math.max(wordCount, 1)).toFixed(2)} syllables per word`,
        `  longest word: "${stats.longestWord.slice(0, 60)}" | longest sentence: ${stats.longestSentence} words`,
        "",
        `  Flesch reading ease: ${stats.flesch} — ${ease(stats.flesch)}`,
        `  Flesch-Kincaid grade level: ${stats.grade}`,
        "",
        findings.length ? `Findings (${findings.length}):` : "Findings: nothing structural to flag",
        ...findings.map((f) => `  - ${f}`),
        "",
        "Readability is scored from the supplied text alone; no model, no service and no fabricated data is involved.",
    ].join("\n");
}
// ---- muxH tools:
// A Quip thread is a document, so these two read a public encyclopedia article
// the same way: its lead with its provenance, and the skeleton of its headings.
const WIKI = "https://en.wikipedia.org/w/api.php";
const WIKI_UA = "quip-mcp/1.2 (https://github.com/mrfentmen/quip-mcp)";
async function wikiJson(params) {
    const qs = new URLSearchParams({ format: "json", formatversion: "2", ...params });
    let res;
    try {
        res = await fetch(`${WIKI}?${qs}`, {
            signal: AbortSignal.timeout(30000),
            headers: { "User-Agent": WIKI_UA, Accept: "application/json" },
        });
    }
    catch (e) {
        throw new QuipError(`Network error talking to Wikipedia: ${errorMessage(e)}`);
    }
    if (!res.ok)
        throw new QuipError(`Wikipedia answered HTTP ${res.status}.`);
    return res.json();
}
const oneLine = (text) => String(text ?? "").replace(/\s+/g, " ").trim();
const clipped = (text, max) => (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text);
function requireTitle(title) {
    const wanted = String(title ?? "").trim();
    if (!wanted)
        throw new QuipError("Give an article title, for example 'Bitcoin'.");
    return wanted;
}
export async function wikiArticle(title) {
    const wanted = requireTitle(title);
    const data = await wikiJson({
        action: "query",
        redirects: "1",
        prop: "extracts|pageimages|pageprops|revisions",
        exintro: "1",
        explaintext: "1",
        exlimit: "1",
        pithumbsize: "1024",
        rvprop: "ids|timestamp|size|user",
        rvslots: "main",
        titles: wanted,
    });
    const page = data?.query?.pages?.[0];
    if (!page || page.missing)
        throw new QuipError(`Wikipedia has no article called "${wanted}".`);
    const revision = page.revisions?.[0] ?? {};
    const bytes = Number(revision.size ?? 0);
    const lead = oneLine(page.extract);
    const words = lead ? lead.split(/\s+/).length : 0;
    const qid = page.pageprops?.wikibase_item ?? null;
    const image = page.thumbnail?.source ?? null;
    const lines = [
        `${page.title} (page id ${page.pageid})`,
        revision.revid
            ? `Read at revision ${revision.revid}, saved ${String(revision.timestamp ?? "").slice(0, 19).replace("T", " ")} UTC by ${revision.user ?? "an anonymous editor"}`
            : "Wikipedia did not return revision metadata for this page.",
        `Wikitext at that revision: ${bytes.toLocaleString()} byte(s)`,
        `Lead: ${lead.length.toLocaleString()} character(s), ${words.toLocaleString()} word(s)`,
        qid ? `Knowledge item: ${qid} (https://www.wikidata.org/wiki/${qid})` : "Knowledge item: none recorded for this page",
        image ? `Lead image: ${image}` : "Lead image: none on this page",
        "",
        lead ? clipped(lead, 1200) : "Wikipedia has no plain-text lead for this page.",
        "",
        "The lead and the revision are what Wikipedia served at read time; nothing here is summarised or invented.",
    ];
    return lines.join("\n");
}
export async function wikiOutline(title, maxDepth) {
    const wanted = requireTitle(title);
    const depth = Math.min(Math.max(Number(maxDepth ?? 3) || 3, 1), 6);
    const data = await wikiJson({ action: "parse", page: wanted, prop: "sections", redirects: "1" });
    const parsed = data?.parse;
    if (!parsed)
        throw new QuipError(`Wikipedia could not parse an article called "${wanted}".`);
    const sections = Array.isArray(parsed.sections) ? parsed.sections : [];
    if (!sections.length)
        throw new QuipError(`"${parsed.title}" has no sections to outline.`);
    const perLevel = {};
    const shown = [];
    for (const section of sections) {
        const level = Math.max(1, Math.min(6, Number(section.toclevel ?? 1)));
        perLevel[level] = (perLevel[level] ?? 0) + 1;
        if (level <= depth)
            shown.push({ level, line: String(section.line ?? "").trim(), anchor: section.anchor ?? "", number: section.number ?? "" });
    }
    const counts = Object.keys(perLevel).sort().map((level) => `H${level}: ${perLevel[level]}`).join(" | ");
    const lines = [
        `${parsed.title} — ${sections.length} section heading(s)`,
        `Counts by level (whole article): ${counts}`,
        `Showing levels 1 to ${depth}: ${shown.length} heading(s)`,
        "",
    ];
    for (const row of shown) {
        const indent = "  ".repeat(row.level - 1);
        const anchor = row.anchor ? ` #${row.anchor}` : "";
        lines.push(`${indent}H${row.level} ${row.line}${anchor}`);
    }
    if (shown.length < sections.length)
        lines.push("", `${sections.length - shown.length} deeper heading(s) hidden by max_depth.`);
    return lines.join("\n");
}
