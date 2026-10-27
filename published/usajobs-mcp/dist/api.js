/**
 * USAJOBS API client. Needs USAJOBS_API_KEY (free at https://developer.usajobs.gov/)
 * plus a contact email in the User-Agent header (USAJOBS_EMAIL).
 * Docs: https://developer.usajobs.gov/
 */
const BASE = "https://data.usajobs.gov/api";
export class UsajobsError extends Error {
}
function headers() {
    const key = process.env.USAJOBS_API_KEY;
    const email = process.env.USAJOBS_EMAIL ?? "mcp@example.com";
    if (!key)
        throw new UsajobsError("Set USAJOBS_API_KEY first (free at developer.usajobs.gov).");
    return { "User-Agent": email, Accept: "application/json", "Authorization-Key": key };
}
async function getJson(path) {
    const res = await fetch(`${BASE}${path}`, {
        headers: headers(),
        signal: AbortSignal.timeout(20000),
    });
    if (res.status === 401 || res.status === 403)
        throw new UsajobsError("USAJOBS refused (401/403). Check API key.");
    if (!res.ok)
        throw new UsajobsError(`USAJOBS error ${res.status}`);
    return (await res.json());
}
export async function searchJobs(keyword, location = "", limit = 5) {
    const qs = new URLSearchParams({ Keyword: keyword.trim(), ResultsPerPage: String(Math.min(Math.max(limit, 1), 50)) });
    if (location.trim())
        qs.set("LocationName", location.trim());
    const data = await getJson(`/search?${qs}`);
    const sr = data.SearchResult ?? {};
    const rows = Array.isArray(sr.SearchResultItems) ? sr.SearchResultItems : [];
    const total = Number(sr.SearchResultCount ?? rows.length);
    return {
        total: isFinite(total) ? total : rows.length,
        jobs: rows.slice(0, limit).map((it) => {
            const d = it.MatchedObjectDescriptor ?? {};
            const pay = d.PositionRemuneration?.[0] ?? {};
            const locs = Array.isArray(d.PositionLocation) ? d.PositionLocation : [];
            return {
                title: d.PositionTitle,
                agency: d.OrganizationName,
                locations: locs.map((l) => String(l.LocationName ?? l.CityName ?? "")).filter(Boolean).slice(0, 3),
                pay: pay.MinimumRange && pay.MaximumRange ? `$${pay.MinimumRange}-$${pay.MaximumRange}` : undefined,
                grade: Array.isArray(d.JobGrade) ? d.JobGrade.map((g) => g.Code).join(",") : undefined,
                posted: d.PublicationStartDate ? String(d.PublicationStartDate).slice(0, 10) : undefined,
                closes: d.ApplicationCloseDate ? String(d.ApplicationCloseDate).slice(0, 10) : undefined,
                url: d.PositionURI,
            };
        }),
    };
}
export function formatJob(j, index) {
    const prefix = index !== undefined ? `${index + 1}. ` : "";
    const meta = [j.agency, j.locations.join("/"), j.pay, j.grade ? `GS-${j.grade}` : ""].filter(Boolean).join(" · ");
    return `${prefix}${j.title ?? "(untitled)"}${meta ? `\n   ${meta}` : ""}${j.posted || j.closes ? `\n   Posted ${j.posted ?? "?"} — closes ${j.closes ?? "?"}` : ""}${j.url ? `\n   ${j.url}` : ""}`;
}
// ---- muxH tools:
// The one existing tool calls data.usajobs.gov, which has required an API key and
// a registered email address since 2023. These two need neither: they read the
// Federal Register's own public API, which is where the rules that decide who is
// eligible for a federal job are written down. A job search answers what is open;
// these answer who is hiring, under what rules, and how that is shifting.
const UJ_FR = "https://www.federalregister.gov/api/v1";
const UJ_UA = "mcfentmen-usajobs-mcp/1.2 (contactae2000@gmail.com)";
async function ujGet(path, label) {
    let res;
    try {
        res = await fetch(`${UJ_FR}${path}`, { headers: { "User-Agent": UJ_UA, Accept: "application/json" }, signal: AbortSignal.timeout(30000) });
    }
    catch (e) {
        throw new UsajobsError(`Could not reach the Federal Register: ${e.message}`);
    }
    if (res.status === 403 || res.status === 429)
        throw new UsajobsError(`The Federal Register refused the request (${res.status}); it asks for a descriptive User-Agent carrying a contact address.`);
    if (!res.ok)
        throw new UsajobsError(`${label} returned HTTP ${res.status}.`);
    return (await res.json());
}
const ujPlain = (raw) => String(raw ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
/**
 * The federal employment rules themselves, as published: which document, which
 * agency, what type of rule, when it took effect and what it says. These are the
 * documents that decide who is eligible for a federal post, so a job search that
 * finds an opening says nothing about whether the reader qualifies for it.
 */
export async function hiringRules(args) {
    const query = String(args?.query ?? "federal hiring").trim() || "federal hiring";
    const limit = Math.min(Math.max(Number(args?.limit ?? 8) || 8, 1), 30);
    const body = await ujGet(`/documents.json?per_page=${limit}&order=newest&conditions%5Bterm%5D=${encodeURIComponent(query)}`, "the Federal Register search");
    const docs = body.results ?? [];
    if (!docs.length) {
        return `The Federal Register holds no document matching "${query}". The term is matched against titles, abstracts and agency names, so a narrower word finds more.`;
    }
    const lines = [
        `Federal employment rules matching "${query}" — ${body.count?.toLocaleString() ?? "an unstated number of"} document(s) in the register, showing ${docs.length} newest`,
        "",
        ...docs.map((doc, i) => {
            const agencies = (doc.agencies ?? []).map((a) => a.name).filter(Boolean).join(", ");
            const abstract = ujPlain(doc.abstract);
            return [
                `  ${String(i + 1).padStart(2)}. ${ujPlain(doc.title).slice(0, 84)}`,
                `      type: ${doc.type ?? "not reported"}${doc.significant === 1 ? " (significant)" : ""} | agency: ${agencies || "not reported"}`,
                `      published ${doc.publication_date ?? "not reported"}${doc.effective_on ? ` | took effect ${doc.effective_on}` : ""} | pages ${doc.page_length ?? "?"}${doc.start_page ? ` from ${doc.start_page}` : ""}`,
                ...(doc.topics?.length ? [`      topics: ${doc.topics.slice(0, 5).join(", ")}`] : []),
                ...(doc.docket_ids?.length ? [`      docket: ${doc.docket_ids.slice(0, 2).join(", ")}`] : []),
                ...(abstract ? [`      ${abstract.slice(0, 260)}${abstract.length > 260 ? " …" : ""}`] : []),
                ...(doc.html_url ? [`      ${doc.html_url}`] : []),
            ].join("\n");
        }),
    ];
    const withEffect = docs.filter((d) => d.effective_on).length;
    const significant = docs.filter((d) => d.significant === 1).length;
    lines.push("", `${withEffect} of ${docs.length} carry an effective date, and ${significant} are flagged significant, which is the Register's own signal that a rule is worth reading in full rather than skimming.`, "", "This is the published rulebook, not a job list: a rule here can change who may apply, how long a announcement must stay open, or what a pay band may be, without any posting appearing on USAJobs. The term search runs across full text, so a document can match on a phrase deep in its body; the title is the line to check before assuming it is about hiring.");
    return lines.join("\n");
}
/**
 * The shape of federal employment activity over time rather than any one document:
 * how many hiring-related rules were published each year, which agency filed them,
 * what kind of rule they were, and which have actually taken effect. A trend is
 * what tells you a policy is moving, and a single search result cannot.
 */
export async function hiringSignal(args) {
    const query = String(args?.query ?? "federal hiring").trim() || "federal hiring";
    const years = Math.min(Math.max(Number(args?.years ?? 8) || 8, 2), 30);
    // The register caps one query at 1000 documents and returns them newest first, so
    // the date range is pushed into the query itself; otherwise a wide window would
    // only ever describe the most recent couple of years.
    const cutoff = `${new Date().getUTCFullYear() - years}-01-01`;
    const body = await ujGet(`/documents.json?per_page=1000&order=newest&conditions%5Bterm%5D=${encodeURIComponent(query)}&conditions%5Bpublication_date%5D%5Bgte%5D=${cutoff}`, "the Federal Register search");
    const docs = body.results ?? [];
    if (!docs.length) {
        return `The Federal Register holds no document matching "${query}" published on or after ${cutoff}. The term runs across full text, so a narrower word finds more.`;
    }
    const window = docs;
    const byYear = new Map();
    const byAgency = new Map();
    const byType = new Map();
    let effective = 0;
    let significant = 0;
    for (const doc of window) {
        const year = String(doc.publication_date ?? "").slice(0, 4);
        if (/^\d{4}$/.test(year))
            byYear.set(year, (byYear.get(year) ?? 0) + 1);
        const type = doc.type ?? "not reported";
        byType.set(type, (byType.get(type) ?? 0) + 1);
        if (doc.effective_on)
            effective += 1;
        if (doc.significant === 1)
            significant += 1;
        for (const agency of doc.agencies ?? []) {
            const name = agency.name;
            if (name)
                byAgency.set(name, (byAgency.get(name) ?? 0) + 1);
        }
    }
    const yearsSeen = [...byYear.keys()].sort();
    const maxYear = Math.max(...byYear.values());
    const covered = yearsSeen.length;
    const truncated = docs.length >= 1000;
    const maxAgency = Math.max(...byAgency.values(), 1);
    const firstYear = yearsSeen[0];
    const lastYear = yearsSeen[yearsSeen.length - 1];
    const firstCount = byYear.get(firstYear) ?? 0;
    const lastCount = byYear.get(lastYear) ?? 0;
    return [
        `Federal employment activity matching "${query}"`,
        `  ${body.count?.toLocaleString() ?? "an unstated number of"} document(s) in the register; ${window.length} published in the last ${years} years`,
        `  ${covered} calendar year(s) actually represented, from ${firstYear} to ${lastYear}${covered < years ? `, fewer than the ${years} requested` : ""}`,
        ...(truncated ? ["  this is a capped slice: the register returns at most 1000 documents for one query, so the earliest years in the window are cut off rather than empty"] : []),
        `  ${effective} of ${window.length} in the window carry an effective date | ${significant} flagged significant`,
        "",
        "Documents published per year:",
        ...yearsSeen.map((y) => {
            const n = byYear.get(y) ?? 0;
            return `  ${y}  ${String(n).padStart(4)}  ${"#".repeat(Math.max(0, Math.round((n / maxYear) * 34)))}`;
        }),
        "",
        "By document type:",
        ...[...byType.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([t, n]) => `  ${t.slice(0, 44).padEnd(44)}${String(n).padStart(4)}  ${((n / window.length) * 100).toFixed(0).padStart(3)}%`),
        "",
        "By agency, most active first:",
        ...[...byAgency.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([a, n]) => `  ${a.slice(0, 46).padEnd(46)}${String(n).padStart(4)}  ${"#".repeat(Math.max(1, Math.round((n / maxAgency) * 20)))}`),
        "",
        `Direction: ${lastYear === firstYear ? "only one year in the window, so no trend to state" : lastCount > firstCount ? `${lastCount} documents in ${lastYear} against ${firstCount} in ${firstYear}, so activity is rising` : lastCount < firstCount ? `${lastCount} documents in ${lastYear} against ${firstCount} in ${firstYear}, so activity is falling` : `the same number in ${firstYear} and ${lastYear}`}`,
        "",
        "An agency is named on a document only if it is the issuing body, so a rule affecting one agency's hiring is counted under that agency and not under the Office of Personnel Management that may have written it. This is publication volume, not activity volume: a long-unimplemented rule is still counted here, which is why the effective-date count is the more useful of the two figures.",
    ].join("\n");
}
