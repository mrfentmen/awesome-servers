export class PublicWwwError extends Error {
    constructor(message) {
        super(message);
        this.name = "PublicWwwError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
function key() {
    const k = process.env.PUBLICWWW_API_KEY;
    if (!k)
        throw new PublicWwwError("Set PUBLICWWW_API_KEY (paid PublicWWW plan).");
    return k;
}
async function search(keywords, exportType) {
    const url = `https://publicwww.com/websites/${encodeURIComponent(`"${keywords}"`)}/?export=${exportType}&key=${encodeURIComponent(key())}`;
    let res;
    try {
        res = await fetch(url, { headers: { ...UA }, signal: AbortSignal.timeout(60000) });
    }
    catch (e) {
        throw new PublicWwwError(`Network error: ${e.message}`);
    }
    const text = await res.text();
    if (!res.ok)
        throw new PublicWwwError(`HTTP ${res.status}: ${text.slice(0, 300)}`);
    if (text.startsWith("Wrong API key"))
        throw new PublicWwwError("Wrong API key.");
    return text.slice(0, 8000);
}
export function searchSnippets(keywords) {
    return search(keywords, "urls");
}
// ---- muxH tools:
// PublicWWW answers "which live pages contain this string" and needs a paid
// key. Sourcegraph publishes an open code index that answers the same question
// over source code, keylessly, and a snippet profiler that answers the question
// a searcher actually has first: is this string even worth searching for?
const SG_STREAM = "https://sourcegraph.com/.api/search/stream";
const PW_UA = "publicwww-mcp/1.1 (https://github.com/mcfentmen/publicwww-mcp)";
const stripTags = (html) => html
    .replace(/<[^>]*>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
/**
 * Sourcegraph speaks server-sent events. Read the stream, keep the `matches`
 * events and the final progress event, and treat an explicit skip as an error
 * rather than reporting an empty result.
 */
async function sgSearch(query, count) {
    const params = new URLSearchParams({ q: `${query} count:${count}`, v: "V3", t: "literal", display: String(count) });
    const res = await fetch(`${SG_STREAM}?${params}`, {
        headers: { Accept: "text/event-stream", "User-Agent": PW_UA },
        signal: AbortSignal.timeout(45000),
    });
    if (res.status === 429)
        throw new PublicWwwError("Sourcegraph rate-limited this host. Try again shortly.");
    if (!res.ok || !res.body)
        throw new PublicWwwError(`Sourcegraph search error ${res.status}: ${res.statusText}`);
    const body = await res.text();
    const matches = [];
    let progress = {};
    for (const block of body.split("\n\n")) {
        const dataLine = block.split("\n").find((line) => line.startsWith("data: "));
        const eventLine = block.split("\n").find((line) => line.startsWith("event: "));
        if (!dataLine)
            continue;
        let parsed;
        try {
            parsed = JSON.parse(dataLine.slice(6));
        }
        catch {
            continue;
        }
        const event = eventLine?.slice(7).trim();
        if (event === "matches" && Array.isArray(parsed))
            matches.push(...parsed);
        else if (event === "progress")
            progress = parsed;
    }
    const skipped = (progress.skipped ?? []).map((s) => s.message ?? s.reason ?? "unspecified filter");
    return { matches, progress, skipped };
}
/**
 * Search the open source code index for a literal string, the same question
 * PublicWWW answers for the live web but over published source: which
 * repositories use this snippet, and where.
 */
export async function codeSnippetSearch(args) {
    const snippet = (args.snippet ?? "").trim();
    if (snippet.length < 3)
        throw new PublicWwwError("Give a snippet of at least three characters to search for.");
    if (/\s/.test(snippet) && snippet.length > 200) {
        throw new PublicWwwError("That snippet is longer than Sourcegraph's practical literal limit. Search for a distinctive line of it instead.");
    }
    const size = Math.min(Math.max(Math.trunc(args.limit ?? 10), 1), 25);
    const language = (args.language ?? "").trim();
    const query = `content:"${snippet.replace(/"/g, '\\"')}"${language ? ` lang:${language}` : ""}`;
    const { matches, progress, skipped } = await sgSearch(query, size);
    if (!matches.length) {
        const note = skipped.length ? ` The index skipped some repositories: ${skipped.slice(0, 2).join("; ")}.` : "";
        throw new PublicWwwError(`No published repository contains "${snippet.slice(0, 60)}".${note}`);
    }
    const repos = new Map();
    let lineHits = 0;
    for (const match of matches) {
        const repo = match.repository ?? "unknown";
        repos.set(repo, (repos.get(repo) ?? 0) + (match.lineMatches?.length ?? match.chunkMatches?.length ?? 1));
        lineHits += match.lineMatches?.length ?? match.chunkMatches?.length ?? 0;
    }
    return [
        `Source code search for "${snippet.slice(0, 90)}"${language ? ` in ${language}` : ""}`,
        `  ${progress.matchCount ?? matches.length} match(es) reported by the index, ${repos.size} distinct repository(ies) on this page`,
        progress.durationMs ? `  searched in ${progress.durationMs} ms` : "",
        "",
        ...matches.slice(0, size).map((match, i) => {
            const previews = (match.lineMatches ?? [])
                .slice(0, 3)
                .map((line) => `      L${(line.lineNumber ?? 0) + 1}: ${stripTags(String(line.preview ?? "")).slice(0, 150)}`);
            const chunk = match.chunkMatches?.[0]?.content;
            const shown = previews.length ? previews : chunk ? [`      ${stripTags(chunk).slice(0, 200)}`] : ["      no preview returned"];
            return [`  ${String(i + 1).padStart(2)}. ${match.repository ?? "?"} — ${match.path ?? "?"}`, ...shown].join("\n");
        }),
        "",
        `Top repositories: ${[...repos.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([r, n]) => `${r} (${n})`).join(", ")}`,
        skipped.length ? `Index filters applied: ${skipped.slice(0, 3).join("; ")}` : "",
        "",
        "Source: the public Sourcegraph code index. This searches published source, not live web pages.",
    ]
        .filter((line) => line !== "")
        .join("\n");
}
function shannon(text) {
    const counts = new Map();
    for (const char of text)
        counts.set(char, (counts.get(char) ?? 0) + 1);
    const total = text.length;
    let bits = 0;
    const rows = [];
    for (const [char, count] of counts) {
        const p = count / total;
        const contribution = -p * Math.log2(p);
        bits += contribution;
        rows.push({ char, count, bits: contribution });
    }
    return { bits, rows: rows.sort((a, b) => b.bits - a.bits) };
}
/**
 * Whether a snippet is worth searching for at all: its entropy, how minified or
 * commented it is, and its longest line. Obfuscated, packed and minified code
 * all score high, and a PublicWWW search for one of those returns noise.
 */
export async function snippetProfile(args) {
    const snippet = args.snippet ?? "";
    if (!snippet.trim())
        throw new PublicWwwError("Paste the snippet to profile.");
    const capped = snippet.slice(0, 200000);
    const lines = capped.split(/\r?\n/);
    const nonEmpty = lines.filter((l) => l.trim().length > 0);
    const longest = lines.reduce((max, line) => Math.max(max, line.length), 0);
    const avgLine = nonEmpty.length ? nonEmpty.reduce((sum, l) => sum + l.length, 0) / nonEmpty.length : 0;
    const { bits, rows } = shannon(capped);
    // The entropy of the character distribution, which is the conventional
    // "bits per character" figure: 0 for a single repeated character, 8 for a
    // uniform spread over 256 byte values. Natural source sits near 4-5;
    // encoded, encrypted or compressed data pushes towards 8.
    const perChar = bits;
    const commentLines = lines.filter((l) => /^\s*(\/\/|#|\/\*|\*|<!--)/.test(l)).length;
    const commentRatio = lines.length ? commentLines / lines.length : 0;
    const indents = lines.filter((l) => /^\s+/.test(l)).length;
    const minified = longest > 500 && lines.length < 20;
    const oneLiner = lines.length <= 2;
    const hasMarker = /\/\/[#!@]|__webpack|function\s*\(\s*\w+\s*,\s*\w+\s*\)/.test(capped);
    const verdicts = [];
    if (minified)
        verdicts.push(`longest line is ${longest.toLocaleString()} characters across only ${lines.length} line(s): this is minified or packed output.`);
    if (oneLiner && capped.length > 200)
        verdicts.push("it is effectively one line, so there is no structure to search on.");
    if (perChar > 7.2)
        verdicts.push(`entropy of ${perChar.toFixed(2)} bits per character is near the theoretical maximum, which means the text is encoded, encrypted or compressed.`);
    if (perChar < 2.5 && capped.length > 200)
        verdicts.push(`entropy of ${perChar.toFixed(2)} bits per character is very low, so the text is highly repetitive.`);
    if (hasMarker)
        verdicts.push("it contains a build-tool marker (__webpack_require__ or a minified function header).");
    if (commentRatio > 0.2)
        verdicts.push(`${Math.round(commentRatio * 100)}% of the lines are comments, so the distinctive part is smaller than it looks.`);
    const searchable = !minified && !oneLiner && perChar < 7.2 && capped.length >= 12;
    return [
        `Snippet profile (${capped.length.toLocaleString()} characters)`,
        `  Shannon entropy ${bits.toFixed(2)} bits per character (of a possible 8), measured over ${capped.length.toLocaleString()} characters`,
        `  ${lines.length.toLocaleString()} line(s), ${nonEmpty.length.toLocaleString()} non-empty`,
        `  longest line ${longest.toLocaleString()} characters, average non-empty line ${avgLine.toFixed(0)}`,
        `  ${new Set(capped).size} distinct character(s), comment lines ${Math.round(commentRatio * 100)}%, indented lines ${indents}`,
        "",
        "Highest-contribution characters:",
        ...rows.slice(0, 12).map((row, i) => {
            const label = row.char === "\n" ? "\\n" : row.char === "\t" ? "\\t" : row.char === " " ? "space" : row.char;
            return `  ${String(i + 1).padStart(2)}. ${String(label).padEnd(6)} ${String(row.count).padStart(7)} occurrence(s), ${row.bits.toFixed(2)} bits of the total`;
        }),
        "",
        verdicts.length ? `Findings (${verdicts.length}):` : "Findings: nothing that would distort a text search",
        ...verdicts.map((v) => `  - ${v}`),
        "",
        searchable
            ? "Verdict: this is normal source text and is worth searching for as a literal."
            : "Verdict: search a distinctive identifier from inside this snippet instead of the snippet itself.",
        "Computed locally from the supplied text; nothing was fetched.",
    ].join("\n");
}
