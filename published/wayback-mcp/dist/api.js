/**
 * Wayback Machine client. Keyless.
 *  - CDX API lists snapshot history for a URL.
 *  - /wayback/available finds the nearest snapshot.
 *  - /web/{timestamp}id_/{url} serves the archived page content.
 */
const CDX = "https://web.archive.org/cdx/search/cdx";
const AVAILABLE = "https://archive.org/wayback/available";
const UA = "mrfentmen-wayback-mcp/1.0 (https://github.com/mrfentmen)";
export class WaybackError extends Error {
}
async function getText(url, timeoutMs = 45000) {
    let res;
    try {
        res = await fetch(url, {
            headers: { "User-Agent": UA, Accept: "application/json,text/plain,text/html" },
            signal: AbortSignal.timeout(timeoutMs),
        });
    }
    catch (e) {
        // archive.org can be slow under load; surface that as a clear message.
        throw new WaybackError(`Internet Archive did not respond in ${timeoutMs / 1000}s. It may be busy — try again.`);
    }
    if (res.status === 404)
        throw new WaybackError(`Not found (404) for ${url.slice(0, 100)}`);
    if (res.status === 503 || res.status === 429) {
        throw new WaybackError(`Internet Archive is temporarily unavailable (HTTP ${res.status}). Try again shortly.`);
    }
    if (!res.ok)
        throw new WaybackError(`Wayback error ${res.status} for ${url.slice(0, 100)}`);
    return res.text();
}
/**
 * archive.org answers one CDX query at a time comfortably. Firing several at
 * once — which is what happens when a client calls two tools in the same
 * moment, because the MCP server handles requests concurrently — gets them
 * throttled or slow, so each CDX call waits for the one before it.
 */
let cdxQueue = Promise.resolve();
function cdxOnce(work) {
    const next = cdxQueue.then(work, work);
    cdxQueue = next.then(() => undefined, () => undefined);
    return next;
}
/** CDX answers with JSON, but on a miss it can reply with an empty body or plain text. */
async function cdx(query, timeoutMs = 45000) {
    const text = (await cdxOnce(() => getText(`${CDX}?${query}`, timeoutMs))).trim();
    if (!text)
        return [];
    let rows;
    try {
        rows = JSON.parse(text);
    }
    catch {
        if (/^\s*</.test(text)) {
            throw new WaybackError(`The Internet Archive could not answer that CDX query (it replied with HTML, usually a gateway timeout). Narrow the request with a date range or try again.`);
        }
        throw new WaybackError(`Unexpected CDX response: ${text.slice(0, 200)}`);
    }
    if (!Array.isArray(rows) || rows.length <= 1)
        return [];
    return rows.slice(1).filter((r) => Array.isArray(r));
}
const snapshotUrl = (ts, original) => `https://web.archive.org/web/${ts}id_/${original}`;
export async function getSnapshots(url, args = {}) {
    const limit = Math.min(Math.max(Number(args.limit) || 10, 1), 50);
    const parts = [
        `url=${encodeURIComponent(url)}`,
        "output=json",
        "fl=timestamp,original,statuscode,mimetype,length",
        "filter=statuscode:200",
        `limit=${limit}`,
    ];
    if (args.from)
        parts.push(`from=${encodeURIComponent(args.from)}`);
    if (args.to)
        parts.push(`to=${encodeURIComponent(args.to)}`);
    const rows = await cdx(parts.join("&"));
    return rows.map((r) => ({
        timestamp: r[0] ?? "",
        original: r[1] ?? url,
        statusCode: r[2] ?? "",
        mimeType: r[3] ?? "",
        length: r[4] ?? "",
        url: snapshotUrl(r[0] ?? "", r[1] ?? url),
    }));
}
/** Widest view: every host under a domain, not just the exact URL. */
export async function domainSnapshots(domain, limit = 20) {
    const capped = Math.min(Math.max(Number(limit) || 20, 1), 50);
    const rows = await cdx(`url=${encodeURIComponent(domain)}&matchType=domain&output=json&fl=timestamp,original,statuscode,mimetype,length&filter=statuscode:200&limit=${capped}`);
    return rows.map((r) => ({
        timestamp: r[0] ?? "",
        original: r[1] ?? domain,
        statusCode: r[2] ?? "",
        mimeType: r[3] ?? "",
        length: r[4] ?? "",
        url: snapshotUrl(r[0] ?? "", r[1] ?? domain),
    }));
}
/**
 * First/last capture plus a per-year breakdown.
 *
 * Three cheap CDX calls rather than one exhaustive scan: collapsing the whole
 * capture history takes tens of seconds and sometimes times out, while
 * limit=1 / limit=-1 / collapse=timestamp:4 all come back in a few seconds.
 */
export async function siteHistory(url, years = 15) {
    const base = `url=${encodeURIComponent(url)}&output=json&fl=timestamp`;
    // Sequential on purpose: firing these three CDX queries concurrently gets the
    // requests throttled with 503s, and a single failure must not lose the rest.
    const run = async (query) => {
        try {
            return await cdx(query);
        }
        catch (e) {
            failures.push(e);
            return [];
        }
    };
    const failures = [];
    const firstRows = await run(`${base}&limit=1`);
    const lastRows = await run(`${base}&limit=-1`);
    const perYear = await run(`${base}&collapse=timestamp:4`);
    if (failures.length === 3) {
        const reason = failures[0];
        throw reason instanceof Error ? reason : new WaybackError("CDX lookup failed");
    }
    const first = firstRows[0]?.[0] ?? "";
    const last = lastRows[0]?.[0] ?? "";
    const byYear = perYear
        .map((r) => r[0] ?? "")
        .filter(Boolean)
        .sort((a, b) => b.localeCompare(a))
        .slice(0, Math.min(Math.max(years, 1), 40))
        .map((ts) => ({ year: ts.slice(0, 4), count: 1 }));
    if (!first && !last)
        return { first: "", last: "", total: 0, byYear: [] };
    return { first, last, total: byYear.length, byYear };
}
export async function getAvailability(url) {
    const text = await getText(`${AVAILABLE}?url=${encodeURIComponent(url)}`);
    const d = JSON.parse(text);
    const closest = d.archived_snapshots?.closest;
    if (!closest?.url)
        return null;
    return {
        timestamp: closest.timestamp ?? "",
        original: url,
        statusCode: closest.status ?? "",
        mimeType: "",
        length: "",
        url: closest.url,
    };
}
export async function getSnapshotText(timestamp, originalUrl, maxChars = 15000) {
    const raw = await getText(snapshotUrl(timestamp, originalUrl));
    const plain = raw
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, "\n")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
    return plain.slice(0, maxChars);
}
export function fmtTimestamp(ts) {
    if (ts.length < 12)
        return ts;
    return `${ts.slice(0, 4)}-${ts.slice(4, 6)}-${ts.slice(6, 8)} ${ts.slice(8, 10)}:${ts.slice(10, 12)} UTC`;
}
export function formatSnapshot(s, index) {
    const head = `${index !== undefined ? `${index + 1}. ` : ""}${fmtTimestamp(s.timestamp)}`;
    const lines = [
        head,
        `${s.original}`,
        `Status ${s.statusCode || "?"}${s.mimeType ? ` · ${s.mimeType}` : ""}${s.length ? ` · ${s.length} bytes` : ""}`,
        s.url,
    ].filter(Boolean);
    return lines.join("\n");
}
// ---- batch-5 tools: status history, capture gaps, snapshot diff, broken pages (2026-09-27) ----
const monthOf = (ts) => `${ts.slice(0, 4)}-${ts.slice(4, 6)}`;
/**
 * One row per archived month with the status code recorded then. A page that
 * started redirecting or returning 404 keeps its old 200 captures, so the month
 * list is the only place that change is visible.
 */
export async function statusHistory(url, limit = 24) {
    const target = (url ?? "").trim();
    if (!target)
        throw new WaybackError("Provide a URL, e.g. 'example.com'.");
    const capped = Math.min(Math.max(Math.trunc(limit) || 24, 1), 120);
    // limit=-N asks CDX for the newest N rows, which is the end of the history that matters.
    const rows = await cdx(`url=${encodeURIComponent(target)}&output=json&fl=timestamp,statuscode&collapse=timestamp:6&limit=-${capped}`);
    if (!rows.length)
        return `No archived snapshots of ${target}.`;
    const ordered = [...rows].sort((a, b) => String(b[0] ?? "").localeCompare(String(a[0] ?? "")));
    const tally = new Map();
    for (const row of rows) {
        const code = (row[1] ?? "").trim() || "-";
        tally.set(code, (tally.get(code) ?? 0) + 1);
    }
    const codes = [...tally.entries()].sort((a, b) => b[1] - a[1]).map(([code, n]) => `${code} (${n} month(s))`);
    const broken = rows.filter((row) => /^[45]/.test((row[1] ?? "").trim())).length;
    return [
        `Archived status history for ${target} — newest ${ordered.length} month(s) with a capture:`,
        ...ordered.map((row) => `  ${monthOf(row[0] ?? "")} — ${(row[1] ?? "").trim() || "-"}`),
        "",
        `Status codes seen: ${codes.join(", ")}`,
        broken
            ? `${broken} of these months were archived with a 4xx/5xx status, so the page was already broken then.`
            : "Every month shown archived cleanly.",
        `A "-" code means the crawler stored the capture without an HTTP status.`,
    ].join("\n");
}
/**
 * Coverage of the archive for one URL: which months inside the captured span
 * have no capture at all, and the longest run of them. This is how a research
 * or compliance question gets answered honestly: not "is it archived" but
 * "how much of the period is actually missing".
 */
export async function captureGaps(url, since) {
    const target = (url ?? "").trim();
    if (!target)
        throw new WaybackError("Provide a URL, e.g. 'example.com'.");
    const encoded = encodeURIComponent(target);
    const thisYear = new Date().getUTCFullYear();
    // Where the history starts comes from one cheap query. Asking CDX to collapse
    // the whole history in a single request is the query archive.org answers with
    // a gateway timeout, so the coverage is read one year at a time instead.
    const firstRows = await cdx(`url=${encoded}&output=json&fl=timestamp&limit=1`);
    if (!firstRows.length)
        return `Nothing archived for ${target}.`;
    const firstCapture = String(firstRows[0]?.[0] ?? "");
    const firstYear = Number(firstCapture.slice(0, 4)) || thisYear;
    const wanted = /^\d{4}$/.test(String(since ?? "").trim()) ? Number(String(since).trim()) : NaN;
    const startYear = Math.max(Number.isFinite(wanted) ? wanted : firstYear, thisYear - 9);
    const years = [];
    for (let year = startYear; year <= thisYear; year += 1)
        years.push(year);
    const seen = new Set();
    const unanswered = [];
    for (const year of years) {
        try {
            const rows = await cdx(`url=${encoded}&output=json&fl=timestamp&collapse=timestamp:6&limit=100&from=${year}0101&to=${year}1231`);
            for (const row of rows) {
                const month = monthOf(row[0] ?? "");
                if (/^\d{4}-\d{2}$/.test(month))
                    seen.add(month);
            }
        }
        catch {
            unanswered.push(year);
        }
    }
    if (!seen.size && unanswered.length === years.length) {
        throw new WaybackError(`The Internet Archive did not answer any of the ${years.length} yearly CDX queries for ${target}. It is probably busy — try again.`);
    }
    const months = [...seen].sort();
    if (!months.length) {
        return `No captures of ${target} between ${startYear} and ${thisYear}. The first capture on record is ${firstCapture || "unknown"}.`;
    }
    const first = months[0];
    const last = months[months.length - 1];
    const span = [];
    let [year, month] = first.split("-").map(Number);
    const [lastYear, lastMonth] = last.split("-").map(Number);
    while (year < lastYear || (year === lastYear && month <= lastMonth)) {
        span.push(`${year}-${String(month).padStart(2, "0")}`);
        month += 1;
        if (month > 12) {
            month = 1;
            year += 1;
        }
    }
    const missing = span.filter((m) => !seen.has(m));
    let run = [];
    let longest = [];
    for (const m of span) {
        if (seen.has(m)) {
            run = [];
            continue;
        }
        run = [...run, m];
        if (run.length > longest.length)
            longest = run;
    }
    const percent = span.length ? Math.round((seen.size / span.length) * 100) : 0;
    return [
        `Archive coverage for ${target}`,
        `  Window checked: ${years[0]}-01 to ${thisYear}-12, read one year at a time (10 years per call at most)`,
        `  First capture on record: ${firstCapture || "unknown"}`,
        `  Captured months: ${seen.size} of ${span.length} between ${first} and ${last}`,
        `  Coverage: ${percent}%`,
        unanswered.length ? `  Years archive.org did not answer: ${unanswered.join(", ")} — they are counted as gaps here, so rerun if that matters` : "",
        `  Months with no capture: ${missing.length}`,
        longest.length
            ? `  Longest gap: ${longest[0]} to ${longest[longest.length - 1]} (${longest.length} month(s))`
            : "  No gaps: every month in the span has at least one capture.",
        missing.length
            ? `\nMonths missing: ${missing.slice(0, 40).join(", ")}${missing.length > 40 ? `, and ${missing.length - 40} more` : ""}`
            : "",
    ]
        .filter((line) => line !== "")
        .join("\n");
}
const words = (text) => {
    const found = text.toLowerCase().match(/[a-z][a-z0-9'’-]{3,}/g) ?? [];
    return [...new Set(found)];
};
/**
 * What actually changed between the same page in two different years: the
 * wording that appeared and the wording that vanished. compare_years prints the
 * two pages; this reports the difference between them.
 */
export async function snapshotDiff(args) {
    const target = (args.url ?? "").trim();
    if (!target)
        throw new WaybackError("Provide a URL, e.g. 'example.com'.");
    const yearA = String(args.yearA ?? "").trim();
    const yearB = String(args.yearB ?? "").trim();
    for (const [label, year] of [["yearA", yearA], ["yearB", yearB]]) {
        if (!/^\d{4}$/.test(year))
            throw new WaybackError(`Provide ${label} as a four digit year, e.g. 2015.`);
    }
    if (yearA === yearB)
        throw new WaybackError("Give two different years to compare.");
    const maxChars = Math.min(Math.max(Math.trunc(args.maxChars ?? 12000) || 12000, 1000), 50000);
    // The year's first 200 capture is found with one bounded CDX query rather
    // than getSnapshots, so this call can wait longer than the default and is not
    // competing with other CDX traffic for a short timeout.
    const read = async (year) => {
        const rows = await cdx(`url=${encodeURIComponent(target)}&output=json&fl=timestamp,original&filter=statuscode:200&limit=1&from=${year}0101&to=${year}1231`, 60000);
        const timestamp = String(rows[0]?.[0] ?? "");
        if (!timestamp)
            return null;
        const original = String(rows[0]?.[1] ?? target);
        const text = await getSnapshotText(timestamp, original, maxChars);
        return { text, timestamp };
    };
    const a = await read(yearA);
    const b = await read(yearB);
    if (!a && !b)
        return `Nothing archived for ${target} in ${yearA} or ${yearB}.`;
    if (!a)
        return `Nothing archived for ${target} in ${yearA}, so there is nothing to diff against ${yearB} (which has a ${b?.timestamp ? fmtTimestamp(b.timestamp) : "?"} capture).`;
    if (!b)
        return `Nothing archived for ${target} in ${yearB}, so there is nothing to diff against ${yearA} (which has a ${fmtTimestamp(a.timestamp)} capture).`;
    const before = words(a.text);
    const after = words(b.text);
    const beforeSet = new Set(before);
    const afterSet = new Set(after);
    const added = after.filter((w) => !beforeSet.has(w));
    const removed = before.filter((w) => !afterSet.has(w));
    const shared = after.filter((w) => beforeSet.has(w)).length;
    const overlap = after.length ? Math.round((shared / after.length) * 100) : 0;
    const sample = (list) => list.length ? list.slice(0, 25).join(", ") + (list.length > 25 ? `, and ${list.length - 25} more` : "") : "—";
    return [
        `Diff of ${target} between ${yearA} and ${yearB}`,
        `  ${yearA}: ${fmtTimestamp(a.timestamp)} capture, ${a.text.length} chars, ${before.length} distinct words`,
        `  ${yearB}: ${fmtTimestamp(b.timestamp)} capture, ${b.text.length} chars, ${after.length} distinct words`,
        `  Wording kept: ${shared} of ${after.length} words (${overlap}% of ${yearB} still present in ${yearA})`,
        "",
        `Words only in ${yearB} (${added.length}): ${sample(added)}`,
        "",
        `Words only in ${yearA} (${removed.length}): ${sample(removed)}`,
        "",
        "Words are compared after stripping markup and lowercasing, so this is a wording diff, not a byte diff.",
    ].join("\n");
}
/**
 * Captures that came back as something other than 200 across a whole domain:
 * redirects and dead pages. Link-rot checks and site audits start here.
 */
export async function brokenPages(url, limit = 15) {
    const target = (url ?? "").trim();
    if (!target)
        throw new WaybackError("Provide a domain, e.g. 'example.com'.");
    const capped = Math.min(Math.max(Math.trunc(limit) || 15, 1), 50);
    const rows = await cdx(`url=${encodeURIComponent(target)}&matchType=domain&output=json&fl=timestamp,original,statuscode&filter=!statuscode:200&limit=${capped}`);
    const unique = [...new Map(rows.map((row) => [`${row[0]}|${row[1]}`, row])).values()];
    if (!unique.length) {
        return `Every archived capture of ${target} came back 200 — no redirects or error captures in the archive.`;
    }
    return [
        `Archived captures of ${target} that were not HTTP 200 (${unique.length} shown):`,
        ...unique.map((row) => {
            const code = (row[2] ?? "").trim() || "-";
            const kind = /^3/.test(code) ? "redirect" : /^[45]/.test(code) ? "broken" : "no status";
            return `  ${fmtTimestamp(row[0] ?? "")} — ${code} (${kind})\n     ${row[1] ?? target}`;
        }),
        "",
        `These are the archived copies, not the live site: a 404 here means the crawler captured that page broken, which is what link rot looks like over time.`,
    ].join("\n");
}
// ---- muxH tools:
// The ten tools above ask when a site was captured, what status it returned and
// which pages came back broken. None of them looks at what the archive actually
// contains. These two do: the shape of the capture record by content type, and the
// inventory of path prefixes inside it. Both read the CDX index, which needs no key.
const WB2_UA = "mcfentmen-wayback-mcp/1.1 (https://github.com/mcfentmen/wayback-mcp)";
const WB2_FIELDS = "timestamp,original,statuscode,mimetype";
async function wb2Cdx(query, label) {
    const url = `https://web.archive.org/cdx/search/cdx?${query}`;
    // The archive index is unreliable under any load: it truncates connections,
    // answers 503 and occasionally hangs, so every failure is retried once.
    let lastNote = "";
    for (let attempt = 1; attempt <= 3; attempt += 1) {
        try {
            const res = await fetch(url, { headers: { "User-Agent": WB2_UA, Accept: "application/json" }, signal: AbortSignal.timeout(60000) });
            if (res.ok) {
                const text = await res.text();
                if (!text.trim())
                    return [];
                let parsed;
                try {
                    parsed = JSON.parse(text);
                }
                catch {
                    throw new WaybackError(`${label} did not return JSON; the archive index sometimes answers with HTML when it is unhappy.`);
                }
                if (!Array.isArray(parsed))
                    return [];
                // CDX answers with positional arrays, not objects: a header row of field
                // names then one array per capture, so the header decides each index.
                const first = parsed[0];
                const isHeader = Array.isArray(first) && first.every((c) => typeof c === "string") && first.some((c) => c === "timestamp" || c === "original");
                const header = (isHeader ? first : WB2_FIELDS.split(",")).map((h) => h.trim());
                const body = (isHeader ? parsed.slice(1) : parsed);
                const at = (row, name) => {
                    const index = header.indexOf(name);
                    if (index < 0)
                        return undefined;
                    const value = row[index];
                    return value === undefined || value === null ? undefined : String(value);
                };
                return body
                    .filter((row) => Array.isArray(row))
                    .map((row) => ({
                    timestamp: at(row, "timestamp"),
                    original: at(row, "original"),
                    statuscode: at(row, "statuscode"),
                    mimetype: at(row, "mimetype"),
                }));
            }
            if (res.status !== 503 && res.status !== 429) {
                throw new WaybackError(`${label} returned HTTP ${res.status} from the archive index.`);
            }
            lastNote = `HTTP ${res.status}, the index is throttling`;
        }
        catch (e) {
            if (e instanceof WaybackError)
                throw e;
            const message = e.message ?? String(e);
            if (/did not return JSON|HTTP \d+/.test(message))
                throw e;
            lastNote = e.name === "TimeoutError" || /abort|fetch failed/i.test(message) ? "the request timed out or the connection dropped" : message;
        }
        await new Promise((r) => setTimeout(r, 2500 * attempt));
    }
    throw new WaybackError(`The archive index did not answer after 3 attempts: ${lastNote}. It throttles bursts, so a pause before the next call helps.`);
}
const wb2Family = (mime) => {
    const m = String(mime ?? "").toLowerCase();
    if (!m)
        return "no mimetype recorded";
    if (m.startsWith("text/html"))
        return "html pages";
    if (m.startsWith("text/css"))
        return "stylesheets";
    if (m.startsWith("text/javascript") || m.includes("javascript") || m.includes("ecmascript"))
        return "javascript";
    if (m.startsWith("image/"))
        return "images";
    if (m.startsWith("application/pdf"))
        return "pdf documents";
    if (m.startsWith("video/") || m.startsWith("audio/"))
        return "media";
    if (m.startsWith("font/"))
        return "fonts";
    if (m.startsWith("application/json") || m.includes("+json"))
        return "json";
    if (m.startsWith("text/"))
        return "other text";
    return "other binary";
};
/**
 * What lives under a path: for a domain and a prefix, the archived URLs beneath
 * it, how many there are, when the oldest and newest were captured, and the shape
 * of the path tree one level down. The inventory question behind "what did this
 * part of the site actually contain".
 */
export async function prefixInventory(args) {
    const domain = String(args?.domain ?? "").trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (!domain)
        throw new WaybackError("Give a domain, e.g. 'example.com'.");
    const prefix = String(args?.prefix ?? "/").trim() || "/";
    if (!prefix.startsWith("/"))
        throw new WaybackError(`Give the prefix as a path starting with "/", for example "/blog" or "/" for the whole site.`);
    const limit = Math.min(Math.max(Number(args?.limit ?? 15) || 15, 1), 40);
    // Asking for a bare domain with matchType=domain works; the same domain written
    // with a trailing slash and matchType=prefix makes the index hang, so the two
    // cases are built differently rather than composed.
    const query = prefix === "/"
        ? `url=${encodeURIComponent(domain)}&matchType=domain`
        : `url=${encodeURIComponent(domain + prefix)}&matchType=prefix`;
    const rows = await wb2Cdx(`${query}&output=json&fl=${WB2_FIELDS}&collapse=urlkey&limit=120`, `the archive under ${domain}${prefix}`);
    if (!rows.length) {
        return `The archive index holds nothing under ${domain}${prefix}. Either the path was never crawled or the prefix is spelled differently from how the site served it.`;
    }
    const children = new Map();
    const years = new Set();
    const families = new Map();
    const codes = new Map();
    let deepest = 0;
    const rest = prefix === "/" ? "" : prefix.replace(/\/$/, "");
    for (const row of rows) {
        const url = String(row.original ?? "");
        let path = "";
        try {
            path = new URL(url.replace(/^\/\//, "http://")).pathname;
        }
        catch {
            path = "";
        }
        const tail = prefix === "/" ? path : path.startsWith(rest) ? path.slice(rest.length) : "";
        const segment = tail.split("/").filter(Boolean)[0] ?? "(index at the prefix)";
        children.set(segment, (children.get(segment) ?? 0) + 1);
        deepest = Math.max(deepest, tail.split("/").filter(Boolean).length);
        const year = String(row.timestamp ?? "").slice(0, 4);
        if (/^\d{4}$/.test(year))
            years.add(year);
        const family = wb2Family(row.mimetype);
        families.set(family, (families.get(family) ?? 0) + 1);
        const code = String(row.statuscode ?? "?");
        codes.set(code, (codes.get(code) ?? 0) + 1);
    }
    const total = rows.length;
    const ranked = [...children.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    return [
        `Archive inventory of ${domain}${prefix}`,
        `  ${total} distinct URL(s) archived under that prefix`,
        years.size ? `  captured between ${Math.min(...[...years].map(Number))} and ${Math.max(...[...years].map(Number))}` : "  no usable timestamps",
        `  deepest path under the prefix: ${deepest} segment(s) past it`,
        `  by status: ${[...codes.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([c, n]) => `${n} ${c}`).join(", ")}`,
        `  by content: ${[...families.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([f, n]) => `${n} ${f}`).join(", ")}`,
        "",
        `Sections one level down (${Math.min(limit, ranked.length)} of ${ranked.length}):`,
        ...ranked.slice(0, limit).map(([segment, n], i) => `  ${String(i + 1).padStart(2)}. ${segment.slice(0, 48).padEnd(48)}${String(n).padStart(5)}  ${((n / total) * 100).toFixed(1)}%  ${"#".repeat(Math.max(1, Math.round((n / ranked[0]?.[1] || 1) * 22)))}`),
        ...(ranked.length > limit ? [`  (+${ranked.length - limit} further section(s) not shown)`] : []),
        "",
        "The index answers one row per distinct URL key, so this is the set of addresses that were stored, not the number of times each was fetched. A prefix matching nothing can still have been crawled, because the match is on the address as the site served it, and a site that has since moved will answer a different path than the one that used to exist.",
    ].join("\n");
}
/**
 * What the archive is made of, not when it was captured: one HTML page pulls in
 * dozens of scripts and images, so a domain with a million captures may hold
 * only a few thousand pages — and the mix tells you what was being tracked.
 */
export async function contentProfile(args) {
    const domain = String(args?.domain ?? "").trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (!domain)
        throw new WaybackError("Give a domain, e.g. 'example.com'.");
    const limit = Math.min(Math.max(Number(args?.limit ?? 12) || 12, 1), 30);
    const rows = await wb2Cdx(`url=${encodeURIComponent(domain)}&matchType=domain&output=json&fl=${WB2_FIELDS}&limit=1500`, `the captures under ${domain}`);
    if (!rows.length)
        return `The archive index holds no captures for ${domain}. Either it was never crawled or the domain is spelled differently.`;
    const total = rows.length;
    const families = new Map();
    const mimes = new Map();
    const codes = new Map();
    const prefixes = new Map();
    const schemes = new Map();
    const years = new Set();
    // A revisit record means the crawler found the bytes unchanged; it is not a
    // binary file, and lumping it in with them makes the mix read wrongly.
    const profileFamily = (mime) => (String(mime ?? "").toLowerCase().includes("warc/revisit") ? "duplicate revisits" : wb2Family(mime));
    for (const row of rows) {
        const family = profileFamily(row.mimetype);
        families.set(family, (families.get(family) ?? 0) + 1);
        const mime = String(row.mimetype ?? "").split(";")[0].trim() || "(none recorded)";
        mimes.set(mime, (mimes.get(mime) ?? 0) + 1);
        const code = String(row.statuscode ?? "?");
        codes.set(code, (codes.get(code) ?? 0) + 1);
        const year = String(row.timestamp ?? "").slice(0, 4);
        if (new RegExp("^\\d{4}$").test(year))
            years.add(year);
        let path = "";
        let protocol = "";
        try {
            const parsed = new URL(String(row.original ?? "").replace(/^\/\//, "http://"));
            path = parsed.pathname;
            protocol = parsed.protocol.replace(":", "");
        }
        catch {
            path = "";
        }
        if (protocol)
            schemes.set(protocol, (schemes.get(protocol) ?? 0) + 1);
        const first = path.split("/").filter(Boolean)[0] ?? "(root)";
        prefixes.set(first, (prefixes.get(first) ?? 0) + 1);
    }
    const pct = (n) => `${((n / total) * 100).toFixed(1)}%`;
    const bar = (n) => "#".repeat(Math.max(1, Math.round((n / total) * 36)));
    const ranked = [...families.entries()].sort((a, b) => b[1] - a[1]);
    const ok2xx = [...codes.entries()].filter(([c]) => c.startsWith("2")).reduce((s, [, n]) => s + n, 0);
    const bad = [...codes.entries()].filter(([c]) => c.startsWith("4") || c.startsWith("5")).reduce((s, [, n]) => s + n, 0);
    return [
        `Archive content profile of ${domain} — ${total} captures${years.size ? `, ${Math.min(...[...years].map(Number))}-${Math.max(...[...years].map(Number))}` : ""}`,
        `  pages to everything else  ${ranked.find(([f]) => f === "html pages")?.[1] ?? 0} : ${total - (ranked.find(([f]) => f === "html pages")?.[1] ?? 0)}`,
        `  successful (2xx)          ${ok2xx} (${pct(ok2xx)})`,
        `  failed (4xx/5xx)          ${bad} (${pct(bad)})`,
        "",
        "What the captures are:",
        ...ranked.map(([family, count]) => `  ${family.padEnd(22)} ${String(count).padStart(5)}  ${pct(count).padStart(6)}  ${bar(count)}`),
        "",
        `Top mimetypes (of ${mimes.size} distinct):`,
        ...[...mimes.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([m, c]) => `  ${m.padEnd(34)} ${String(c).padStart(5)}  ${pct(c)}`),
        "",
        "Status codes:",
        ...[...codes.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([c, n]) => `  ${c.padEnd(6)} ${String(n).padStart(5)}  ${pct(n)}`),
        "",
        `Busiest path prefixes (top ${Math.min(limit, prefixes.size)} of ${prefixes.size}):`,
        ...[...prefixes.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([p, n]) => `  /${p.padEnd(30)} ${String(n).padStart(5)}  ${pct(n)}`),
        "",
        schemes.size ? `Schemes served: ${[...schemes.entries()].map(([s, n]) => `${s} ${n}`).join(", ")}` : "No parsable URLs in the index.",
        "",
        `note: read from a single CDX pass capped at 1,500 captures, so a large site is sampled rather than counted. Assets crawl far more often than pages, which is why the page share looks small. A "duplicate revisit" is a crawl that found the bytes unchanged, so it counts as a capture without being new content.`,
    ].join("\n");
}
