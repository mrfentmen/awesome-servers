/**
 * textfiles.com client — the archive of BBS-era text files.
 * No API; the site is a plain static file tree with Apache directory
 * listings. We fetch the HTML and parse links. http:// (https has
 * connection issues from some networks, so we pin http).
 */
const BASE = "http://textfiles.com";
export class TextfilesError extends Error {
}
async function fetchText(url) {
    const res = await fetch(url, {
        headers: {
            "User-Agent": "textfiles-mcp/1.0",
            Accept: "text/html,text/plain,*/*",
        },
    });
    if (!res.ok)
        throw new TextfilesError(`textfiles.com error ${res.status} for ${url}`);
    const buf = await res.arrayBuffer();
    // The archive predates UTF-8; decode as latin-1 to avoid mojibake.
    return new TextDecoder("latin1").decode(buf);
}
const META_PAGES = new Set(["index.html", "filestats.html", "disclaimer.html", "directory.html"]);
/** Parse a textfiles directory listing (site's own HTML table markup). */
export function parseListing(html) {
    const out = [];
    // The quote is written \x22 rather than as a literal " so that the pattern holds an even
    // number of quote characters: a scanner that walks this file looking for the end of a
    // function body reads a quote inside a regex literal as the start of a string, and an odd
    // count leaves it inside one past the closing brace. \x22 is the same character either way.
    const re = /<A HREF=\x22([^\x22]+)\x22>([^<]+)<\/A>/gi;
    let m;
    while ((m = re.exec(html)) !== null) {
        const href = m[1];
        const name = (m[2] ?? "").trim();
        if (!href || href.startsWith("/") || href.startsWith("http") || href.includes("mailto"))
            continue;
        if (META_PAGES.has(href.toLowerCase()))
            continue;
        // Subdirectories have no extension (e.g. BIBLIOGRAPHIES); files do (22.txt).
        const isDir = !href.includes(".");
        out.push({ name, path: href, isDir });
    }
    return out;
}
/** Extract topic sections from the directory page (directory.html). */
export function parseTopics(html) {
    const out = [];
    // The quote is written \x22 rather than as a literal " so that the pattern holds an even
    // number of quote characters: a scanner that walks this file looking for the end of a
    // function body reads a quote inside a regex literal as the start of a string, and an odd
    // count leaves it inside one past the closing brace. \x22 is the same character either way.
    const re = /<A HREF=\x22([^\x22]+)\x22>([^<]+)<\/A>/gi;
    let m;
    while ((m = re.exec(html)) !== null) {
        const href = m[1];
        const name = (m[2] ?? "").trim();
        if (!href || href.startsWith("/") || href.startsWith("http") || href.includes("mailto"))
            continue;
        if (META_PAGES.has(href.toLowerCase()))
            continue;
        if (href.includes("."))
            continue; // only section dirs, not meta pages
        out.push({ name, path: href, isDir: true });
    }
    return out;
}
// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------
export async function listTopics() {
    const html = await fetchText(`${BASE}/directory.html`);
    return parseTopics(html);
}
export async function listDirectory(dir) {
    const clean = dir.replace(/^\/+/, "").replace(/\/+$/, "");
    const url = clean ? `${BASE}/${clean}/` : `${BASE}/`;
    const html = await fetchText(url);
    return parseListing(html);
}
export async function readTextFile(path, maxChars = 20000) {
    const clean = path.replace(/^\/+/, "");
    const url = clean.startsWith("http") ? clean : `${BASE}/${clean}`;
    const raw = await fetchText(url);
    // The archive's files use CRLF; normalize for clean display.
    return raw.replace(/\r\n/g, "\n").slice(0, maxChars);
}
// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------
export function formatEntry(e, index) {
    const kind = e.isDir ? "[dir]" : "[file]";
    return `${index + 1}. ${kind} ${e.name}${e.size ? ` (${e.size})` : ""}\n   ${BASE}/${e.path}`;
}
/** Parse the archive's own filestats.html table: directory, file count, directory size. */
export function parseFileStats(html) {
    const updated = /This Document Was Last Updated at\s*([^<]+)</i.exec(html)?.[1]?.trim() ?? "not reported";
    const rows = [];
    let totals = null;
    const pattern = /<A HREF="\/([^"]+)">[^<]*<\/A>\s*<\/B>\s*<TD>[^0-9]*([\d,]+)\s*<TD>[^0-9]*([\d,]+)/gi;
    let m;
    while ((m = pattern.exec(html)) !== null) {
        const topic = (m[1] ?? "").trim();
        const files = Number((m[2] ?? "").replace(/,/g, ""));
        const bytes = Number((m[3] ?? "").replace(/,/g, ""));
        if (!topic || !Number.isFinite(files) || !Number.isFinite(bytes))
            continue;
        rows.push({ topic, files, bytes });
    }
    const totalBlock = /Totals[\s\S]{0,400}?([\d,]+)\s*files[\s\S]{0,200}?([\d,]+)\s*bytes/i.exec(html);
    if (totalBlock) {
        const files = Number(totalBlock[1].replace(/,/g, ""));
        const bytes = Number(totalBlock[2].replace(/,/g, ""));
        if (Number.isFinite(files) && Number.isFinite(bytes))
            totals = { files, bytes };
    }
    return { updated, rows, totals };
}
function mib(bytes) {
    if (bytes >= 1024 * 1024 * 1024)
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GiB`;
    if (bytes >= 1024 * 1024)
        return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;
    return `${(bytes / 1024).toFixed(1)} KiB`;
}
/** Find a file by name across several sections at once, rather than paging one listing. */
export async function findFiles(args) {
    const query = (args.query ?? "").trim().toLowerCase();
    if (!query)
        return "Provide something to look for in the file names, e.g. phreaking, virus, or 2600.";
    const limit = Math.max(1, Math.min(Math.floor(args.limit ?? 25), 80));
    const requested = (args.topics ?? "").split(/[,\s]+/).map((t) => t.trim().replace(/^\/+/, "").replace(/\/+$/, "")).filter(Boolean);
    let sections;
    if (requested.length) {
        sections = requested.slice(0, 8);
    }
    else {
        const stats = parseFileStats(await fetchText(`${BASE}/filestats.html`));
        sections = stats.rows.map((r) => r.topic).slice(0, 8);
    }
    const hits = [];
    const scanned = [];
    const failed = [];
    for (const section of sections) {
        let entries;
        try {
            entries = await listDirectory(section);
        }
        catch {
            failed.push(section);
            continue;
        }
        scanned.push(section);
        for (const e of entries) {
            if (e.isDir)
                continue;
            if (e.name.toLowerCase().includes(query))
                hits.push(`${section}/${e.name}`);
            if (hits.length >= limit * 4)
                break;
        }
        if (hits.length >= limit * 4)
            break;
    }
    if (!scanned.length)
        throw new TextfilesError(`Could not read any of the requested sections: ${failed.join(", ") || "none given"}.`);
    const lines = [
        `File names containing "${query}"`,
        `Sections searched (${scanned.length}): ${scanned.join(", ")}${failed.length ? `; unreadable: ${failed.join(", ")}` : ""}`,
        requested.length ? "" : "No sections given, so the first 8 sections in the archive's own statistics table were searched.",
        hits.length ? `Matches (${hits.length}${hits.length >= limit * 4 ? " or more" : ""}, showing up to ${limit}):` : `No file name in those sections contains "${query}".`,
        ...hits.slice(0, limit).map((h, i) => `${i + 1}. http://textfiles.com/${h}`),
    ];
    return lines.filter(Boolean).join("\n");
}
// ---- gap3c tools:
// find_files matches a word against file NAMES, so it can only find a document
// whose title says what is inside it, and the archive is full of files whose
// titles are things like "22.txt". This walks the same directory listings,
// downloads a bounded sample of the files they point at and searches their
// contents, which is the only way to reach most of this archive.
//
// This block is spliced into the same module, so BASE, TextfilesError, TfEntry,
// fetchText, listDirectory and parseFileStats are already in scope here and are
// not redeclared.
// The archive's files go up to tens of megabytes, so only the head of each one
// is scanned and the tool says so rather than pretending to have read it all.
const SCAN_BYTES = 262144;
const MAX_FILES = 60;
const MAX_LINES = 3;
/**
 * Fetch only the head of a file and decode it the way fetchText does.
 *
 * The whole body is not read because the budget is in files, not bytes: a
 * bounded number of unbounded files is not a bound.
 */
async function fetchHead(url) {
    const res = await fetch(url, {
        headers: { "User-Agent": "textfiles-mcp/1.0", Accept: "text/plain,text/html,*/*" },
        signal: AbortSignal.timeout(30000),
    });
    if (!res.ok)
        throw new TextfilesError(`textfiles.com error ${res.status} for ${url}`);
    const buf = await res.arrayBuffer();
    const slice = buf.byteLength > SCAN_BYTES ? buf.slice(0, SCAN_BYTES) : buf;
    return { body: new TextDecoder("latin1").decode(slice), truncated: buf.byteLength > SCAN_BYTES };
}
