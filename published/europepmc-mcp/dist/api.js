const BASE = "https://www.ebi.ac.uk/europepmc/webservices/rest";
const UA = "mrfentmen-europepmc-mcp/1.0 (https://github.com/mrfentmen)";
export class EuropepmcError extends Error {
}
async function get(url) {
    const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(30000),
    });
    if (!res.ok)
        throw new EuropepmcError(`Europe PMC returned HTTP ${res.status}`);
    return (await res.json());
}
export async function search(args) {
    const q = (args.query ?? "").trim();
    if (!q)
        throw new EuropepmcError("Provide a search query");
    const limit = Math.min(args.limit ?? 10, 20);
    const d = await get(`${BASE}/search?query=${encodeURIComponent(q)}&format=json&pageSize=${limit}`);
    const results = d?.resultList?.result ?? [];
    if (!results.length)
        return `No articles found for \"${q}\"`;
    return `Europe PMC results for \"${q}\" (${d?.hitCount ?? results.length} total):\n` + results.map((a, i) => {
        const journal = a?.journalInfo?.journal?.title ?? "";
        const open = a?.isOpenAccess ? " [open access]" : "";
        return `${i + 1}. [${a?.source ?? ""}:${a?.id ?? ""}] ${a?.title ?? "n/a"}\n   ${a?.authorString?.slice(0, 100) ?? ""} | ${a?.pubYear ?? ""}${journal ? ` | ${journal}` : ""}${open}`;
    }).join("\n");
}
export async function article(args) {
    const extId = (args.extId ?? "").trim();
    if (!extId)
        throw new EuropepmcError("Provide an article ID");
    const source = (args.source ?? "MED").trim().toUpperCase();
    const a = await get(`${BASE}/search?query=EXT_ID:${encodeURIComponent(extId)}%20AND%20SRC:${encodeURIComponent(source)}&format=json&resultType=core&pageSize=1`);
    const r = a?.resultList?.result?.[0];
    if (!r)
        throw new EuropepmcError(`Article not found: ${extId} (${source})`);
    const journal = r?.journalInfo?.journal?.title ?? "";
    const lines = [
        `Title: ${r?.title ?? "n/a"}`,
        `Authors: ${r?.authorString ?? "n/a"}`,
        `Journal: ${journal}${r?.journalInfo?.issue?.publicationDate ? ` | ${r.journalInfo.issue.publicationDate}` : ""}`,
        `Source: ${r?.source ?? ""}:${r?.id ?? ""}`,
    ];
    if (r?.abstractText)
        lines.push(`\nAbstract:\n${r.abstractText.slice(0, 700)}`);
    if (r?.doi)
        lines.push(`\nDOI: ${r.doi}`);
    return lines.join("\n");
}
// Only the sorts that answer 200, checked one at a time. relevance answers a
// 503 and AUTH_FIRST asc fails outright, so neither is offered.
const EUROPEPMC_SORTS = ["CITED desc", "P_PDATE_D desc", "PUB_YEAR desc"];
function europepmcAuthors(value, max = 3) {
    if (typeof value !== "string" || !value.trim())
        return "authors not listed";
    const parts = value
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);
    if (parts.length <= max)
        return parts.join(", ");
    return `${parts.slice(0, max).join(", ")}, +${parts.length - max} more`;
}
function europepmcOpenAccess(value) {
    return value === true || value === "Y" ? "open access" : "";
}
function europepmcHitLine(hit, index) {
    const where = [hit.journalTitle ?? "", hit.pubYear ?? ""].filter(Boolean).join(", ");
    const ref = `[${hit.source ?? ""}:${hit.id ?? ""}]`;
    const bits = [europepmcAuthors(hit.authorString), where, europepmcOpenAccess(hit.isOpenAccess)].filter(Boolean);
    return `${index + 1}. ${ref} ${hit.title ?? "(untitled)"}\n   ${bits.join(" | ")}${hit.doi ? `\n   doi ${hit.doi}` : ""}`;
}
export async function searchPage(args) {
    const query = (args.query ?? "").trim();
    if (!query)
        throw new EuropepmcError("Provide a search query");
    const limit = Math.min(Math.max(Math.trunc(args.limit ?? 25), 1), 100);
    const sort = (args.sort ?? "").trim();
    if (sort && !EUROPEPMC_SORTS.includes(sort)) {
        throw new EuropepmcError(`Unknown sort "${sort}". Europe PMC answers 503 for an unrecognised sort rather than saying so, so this tool accepts only ${EUROPEPMC_SORTS.join(", ")}.`);
    }
    const cursor = (args.cursor ?? "").trim();
    // Page numbers are ignored by this endpoint: page=1, page=2 and page=3 on the
    // same query all return the identical first three ids, verified live, while
    // cursorMark returns the next page. So paging here is cursor only.
    const params = new URLSearchParams();
    params.set("query", query);
    params.set("format", "json");
    params.set("pageSize", String(limit));
    if (sort)
        params.set("sort", sort);
    params.set("cursorMark", cursor || "*");
    const data = await get(`${BASE}/search?${params.toString()}`);
    const rows = Array.isArray(data?.resultList?.result) ? data.resultList.result : [];
    const hitCount = Number(data?.hitCount ?? 0);
    if (!rows.length) {
        return cursor
            ? `No more results for "${query}" after that cursor. The search reports ${hitCount.toLocaleString()} hits in all.`
            : `No articles found for "${query}"`;
    }
    const lines = [
        `Europe PMC results for "${query}"${sort ? `, sorted by ${sort}` : ""}: ${hitCount.toLocaleString()} hits in all, ${rows.length} on this page`,
        "",
        ...rows.map(europepmcHitLine),
    ];
    const next = typeof data?.nextCursorMark === "string" ? data.nextCursorMark : "";
    lines.push("");
    if (next && next !== cursor) {
        lines.push(`Next page cursor: ${next}`);
        lines.push("Pass that value back as the cursor to read the following page. Page numbers do not work on this endpoint.");
    }
    else {
        lines.push("That is the last page.");
    }
    return lines.join("\n");
}
async function europepmcGraph(args, kind) {
    const id = (args.id ?? "").trim();
    if (!id)
        throw new EuropepmcError("Provide an article id, like 31986264 for a PubMed record or PPR123456 for a preprint.");
    // A bare id is usually a PubMed one, and preprints live under PPR.
    const source = (args.source ?? (id.toUpperCase().startsWith("PPR") ? "PPR" : "MED")).trim().toUpperCase();
    const limit = Math.min(Math.max(Math.trunc(args.limit ?? 25), 1), 100);
    const page = Math.max(1, Math.trunc(args.page ?? 1));
    const sort = (args.sort ?? "").trim();
    if (sort && !EUROPEPMC_SORTS.includes(sort)) {
        throw new EuropepmcError(`Unknown sort "${sort}". Accepted values are ${EUROPEPMC_SORTS.join(", ")}.`);
    }
    const params = new URLSearchParams();
    params.set("format", "json");
    params.set("pageSize", String(limit));
    params.set("page", String(page));
    if (sort)
        params.set("sort", sort);
    const data = await get(`${BASE}/${encodeURIComponent(source)}/${encodeURIComponent(id)}/${kind}?${params.toString()}`);
    const rows = (kind === "citations" ? data?.citationList?.citation : data?.referenceList?.reference) ?? [];
    const list = Array.isArray(rows) ? rows : [];
    const hitCount = Number(data?.hitCount ?? 0);
    const wording = kind === "citations" ? "articles citing" : "articles cited by";
    if (!list.length) {
        // An unknown id answers hitCount 0 rather than an error, so this is the only
        // place the caller learns the difference between none and a wrong id.
        return `Europe PMC lists no ${wording} ${source}:${id}. An unknown id answers no results rather than an error, so check the id and the source, or that the record genuinely has none.`;
    }
    const lines = [
        `${hitCount.toLocaleString()} ${wording} ${source}:${id}${sort ? `, sorted by ${sort}` : ""}, page ${page}, ${list.length} shown`,
        "",
        ...list.map((row, i) => {
            const where = [row.journalAbbreviation ?? "", row.pubYear ?? "", row.volume ? `vol ${row.volume}` : "", row.pageInfo ?? ""]
                .filter(Boolean)
                .join(", ");
            const ref = `[${row.source ?? ""}:${row.id ?? ""}]`;
            const bits = [europepmcAuthors(row.authorString), where].filter(Boolean);
            return `${i + 1}. ${ref} ${row.title ?? "(untitled)"}\n   ${bits.join(" | ")}${row.doi ? `\n   doi ${row.doi}` : ""}`;
        }),
    ];
    if (hitCount > page * limit)
        lines.push("", `Next page: pass page ${page + 1}.`);
    return lines.join("\n");
}
