/**
 * ProPublica Nonprofit Explorer client, keyless.
 * IRS Form 990 data for every US registered nonprofit.
 */
export class NonprofitError extends Error {
    constructor(message) {
        super(message);
        this.name = "NonprofitError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = "mrfentmen-nonprofit-mcp/1.0";
const BASE = "https://projects.propublica.org/nonprofits/api/v2";
async function get(path) {
    let res;
    try {
        res = await fetch(BASE + path, {
            headers: { "User-Agent": UA, Accept: "application/json" },
            signal: AbortSignal.timeout(25000),
        });
    }
    catch (e) {
        throw new NonprofitError(`Could not reach ProPublica: ${errorMessage(e)}`);
    }
    if (res.status === 404)
        throw new NonprofitError("No nonprofit found for that EIN.");
    if (!res.ok) {
        const body = (await res.text()).slice(0, 200);
        throw new NonprofitError(`ProPublica returned HTTP ${res.status}: ${body}`);
    }
    return res.text();
}
async function getJson(path) {
    const raw = await get(path);
    try {
        return JSON.parse(raw);
    }
    catch {
        throw new NonprofitError("ProPublica returned a non-JSON response.");
    }
}
function page(pageNo) {
    const p = Math.min(Math.max(Math.round(pageNo ?? 0) || 0, 0), 99);
    return p > 0 ? `&page=${p}` : "";
}
export async function search(query, pageNo) {
    const q = query.trim();
    if (q.length < 2)
        throw new NonprofitError("Search needs at least two characters.");
    return getJson(`/search.json?q=${encodeURIComponent(q)}${page(pageNo)}`);
}
export async function searchByState(state, pageNo) {
    const s = state.trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(s))
        throw new NonprofitError(`"${state}" is not a two-letter state code.`);
    return getJson(`/search.json?state%5Bid%5D=${s}${page(pageNo)}`);
}
/** ProPublica filters nonprofits by the numeric NTEE major group: A=1, B=2, ... Z=26. */
export function majorGroupNumber(ntee) {
    const code = ntee.trim().toUpperCase();
    let n;
    if (/^\d{1,2}$/.test(code)) {
        n = Number(code);
    }
    else if (/^[A-Z]$/.test(code)) {
        n = code.charCodeAt(0) - 64;
    }
    else if (/^[A-Z][0-9]{2}$/.test(code)) {
        n = code.charCodeAt(0) - 64;
    }
    else {
        throw new NonprofitError(`"${ntee}" is not an NTEE category. Use a letter (A-Z) or the numeric major group 1-26.`);
    }
    if (n < 1 || n > 26)
        throw new NonprofitError(`NTEE major group must be 1-26, got ${n}.`);
    return n;
}
export async function searchByCategory(ntee, state, pageNo) {
    const code = String(majorGroupNumber(ntee));
    let path = `/search.json?ntee%5Bid%5D=${encodeURIComponent(code)}`;
    if (state && state.trim()) {
        const s = state.trim().toUpperCase();
        if (!/^[A-Z]{2}$/.test(s))
            throw new NonprofitError(`"${state}" is not a two-letter state code.`);
        path += `&state%5Bid%5D=${s}`;
    }
    return getJson(`${path}${page(pageNo)}`);
}
export async function details(ein) {
    return getJson(`/organizations/${cleanEin(ein)}.json`);
}
export function cleanEin(ein) {
    const clean = ein.replace(/[-\s]/g, "");
    if (!/^\d{9}$/.test(clean)) {
        throw new NonprofitError(`"${ein}" is not a 9-digit EIN - search first to find it.`);
    }
    return clean;
}
function money(n) {
    if (typeof n !== "number" || !Number.isFinite(n))
        return "n/a";
    const abs = Math.abs(n);
    if (abs >= 1_000_000_000)
        return `$${(n / 1_000_000_000).toFixed(2)}B`;
    if (abs >= 1_000_000)
        return `$${(n / 1_000_000).toFixed(2)}M`;
    if (abs >= 1_000)
        return `$${(n / 1_000).toFixed(1)}K`;
    return `$${n.toFixed(0)}`;
}
export function formatSearch(result, title) {
    const orgs = result.organizations ?? [];
    if (orgs.length === 0)
        return `No nonprofits match ${title}.`;
    const lines = orgs.map((o) => {
        const where = [o.city, o.state].filter(Boolean).join(", ");
        return `  ${String(o.strein ?? o.ein).padStart(11)}  ${o.name}${o.sub_name ? ` (${o.sub_name})` : ""}\n               ${where}${o.ntee_code ? ` · NTEE ${o.ntee_code}` : ""}`;
    });
    return [
        `${title} - ${result.total_results} match(es), showing ${orgs.length}:`,
        "",
        lines.join("\n"),
        "",
        "Use details with an EIN to see finances and filings.",
    ].join("\n");
}
export function formatDetails(d) {
    const o = d.organization;
    const filings = [...(d.filings_with_data ?? []), ...(d.filings_without_data ?? [])];
    const withData = (d.filings_with_data ?? []).filter((f) => typeof f.totrevenue === "number");
    const latest = withData.sort((a, b) => (b.tax_prd_yr ?? 0) - (a.tax_prd_yr ?? 0))[0];
    const lines = [
        `${o.name}${o.sub_name ? ` (${o.sub_name})` : ""}`,
        `  EIN            ${o.ein}`,
        `  address        ${[o.address, o.city, o.state, o.zipcode].filter(Boolean).join(", ") || "n/a"}`,
        `  NTEE code      ${o.ntee_code ?? "n/a"}`,
        `  ruling date    ${o.ruling_date ?? "n/a"}`,
        `  filings        ${filings.length} on record`,
    ];
    if (latest) {
        lines.push("", `Latest financials (FY ${latest.tax_prd_yr ?? "?"}):`, `  revenue        ${money(latest.totrevenue)}`, `  expenses       ${money(latest.totfuncexpns)}`, `  net            ${money((latest.totrevenue ?? 0) - (latest.totfuncexpns ?? 0))}`, `  assets         ${money(latest.totassetsend)}`, `  liabilities    ${money(latest.totliabend)}`);
    }
    const pdf = filings.find((f) => f.pdf_url)?.pdf_url;
    if (pdf)
        lines.push("", `Latest filing PDF: ${pdf}`);
    return lines.join("\n");
}
export function financialSummary(d) {
    const o = d.organization;
    const rows = (d.filings_with_data ?? [])
        .filter((f) => typeof f.totrevenue === "number" && (f.tax_prd_yr ?? 0) > 0)
        .sort((a, b) => (b.tax_prd_yr ?? 0) - (a.tax_prd_yr ?? 0))
        .slice(0, 8);
    if (rows.length === 0) {
        return `${o.name} has no financial data filed electronically.`;
    }
    const lines = rows.map((f) => {
        const net = (f.totrevenue ?? 0) - (f.totfuncexpns ?? 0);
        return `  ${String(f.tax_prd_yr).padEnd(6)} revenue ${money(f.totrevenue).padStart(11)}  expenses ${money(f.totfuncexpns).padStart(11)}  net ${money(net).padStart(11)}`;
    });
    const newest = rows[0];
    const oldest = rows[rows.length - 1];
    const growth = typeof oldest.totrevenue === "number" && oldest.totrevenue !== 0 && typeof newest.totrevenue === "number"
        ? ((newest.totrevenue - oldest.totrevenue) / Math.abs(oldest.totrevenue)) * 100
        : undefined;
    const tail = growth === undefined
        ? ""
        : `\n\nRevenue change from FY ${oldest.tax_prd_yr} to FY ${newest.tax_prd_yr}: ${growth >= 0 ? "+" : ""}${growth.toFixed(1)}%.`;
    return `${o.name} (EIN ${o.ein}) - revenue and expenses by year:\n\n${lines.join("\n")}${tail}`;
}
export async function compare(eins) {
    const list = eins.map((e) => e.trim()).filter(Boolean).slice(0, 5);
    if (list.length === 0)
        throw new NonprofitError("Give at least one EIN.");
    const profiles = await Promise.all(list.map((e) => details(e)));
    return `Compared ${profiles.length} nonprofits:\n\n${profiles.map((d) => formatDetails(d)).join("\n\n")}`;
}
// ---- batch-4 tools: subsection search and filing history (2026-09-27) ----
/** ProPublica filters by subsection with c_code[id]; these are the common ones. */
const SUBSECTIONS = {
    2: "501(c)(2) title holding corporation",
    3: "501(c)(3) charitable, religious or educational",
    4: "501(c)(4) social welfare",
    5: "501(c)(5) labour and agriculture",
    6: "501(c)(6) business league",
    7: "501(c)(7) social or recreation club",
    8: "501(c)(8) fraternal beneficiary society",
    9: "501(c)(9) employees' beneficiary association",
    10: "501(c)(10) domestic fraternal society",
    12: "501(c)(12) benevolent life insurance",
    13: "501(c)(13) cemetery company",
    19: "501(c)(19) veterans' organisation",
};
function subsectionCode(input) {
    const raw = String(input ?? "").trim().toLowerCase();
    const digits = raw.replace(/[^0-9]/g, "");
    const value = digits ? Number(digits.replace(/^501/, "").replace(/^0+/, "") || digits) : NaN;
    const code = Number.isFinite(value) && value > 0 ? value : Number(raw);
    if (!Number.isFinite(code) || !SUBSECTIONS[code]) {
        throw new NonprofitError(`"${input}" is not a known subsection. Use 3, 4, 6 or 501(c)(3); the API supports ${Object.keys(SUBSECTIONS).join(", ")}.`);
    }
    return code;
}
export async function searchBySubsection(args) {
    const code = subsectionCode(args?.subsection);
    let query = `c_code%5Bid%5D=${code}`;
    const state = String(args?.state ?? "").trim().toUpperCase();
    if (state) {
        if (!/^[A-Z]{2}$/.test(state))
            throw new NonprofitError(`"${args.state}" is not a two-letter state code.`);
        query += `&state%5Bid%5D=${state}`;
    }
    const result = await getJson(`/search.json?${query}${page(args?.page)}`);
    const label = `Subsection ${SUBSECTIONS[code]}${state ? ` in ${state}` : ""}`;
    const rows = result.organizations ?? [];
    if (!rows.length)
        return `No nonprofits match ${label}.`;
    const states = new Map();
    for (const o of rows) {
        const key = o.state ?? "?";
        states.set(key, (states.get(key) ?? 0) + 1);
    }
    const top = [...states.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
    return [
        formatSearch(result, label),
        "",
        `States in this page: ${top.map(([s, n]) => `${s} (${n})`).join(", ")}`,
        `ProPublica lists ${result.total_results} organisation(s) for this filter; paging is 25 per page.`,
    ].join("\n");
}
const FILING_FORMS = { 0: "990", 1: "990-EZ", 2: "990-PF" };
export async function filings(args) {
    const d = await details(args?.ein);
    const o = d.organization;
    const limit = Math.min(Math.max(Math.round(Number(args?.limit ?? 10)) || 10, 1), 20);
    const withData = (d.filings_with_data ?? []).filter((f) => (f.tax_prd_yr ?? 0) > 0);
    const withoutData = (d.filings_without_data ?? []).filter((f) => (f.tax_prd_yr ?? 0) > 0);
    const all = [...withData, ...withoutData].sort((a, b) => (b.tax_prd_yr ?? 0) - (a.tax_prd_yr ?? 0));
    if (!all.length)
        return `${o.name} (EIN ${o.ein}) has no filings on record.`;
    const form = (t) => (typeof t === "number" ? FILING_FORMS[t] ?? `form ${t}` : "form n/a");
    const rows = all.slice(0, limit).map((f) => {
        const parts = [
            `  FY ${String(f.tax_prd_yr).padEnd(5)} ${form(f.formtype).padEnd(8)}`,
            typeof f.totrevenue === "number" ? `revenue ${money(f.totrevenue).padStart(10)}` : "revenue n/a".padStart(18),
            typeof f.totfuncexpns === "number" ? `expenses ${money(f.totfuncexpns).padStart(10)}` : "expenses n/a".padStart(19),
            typeof f.totassetsend === "number" ? `assets ${money(f.totassetsend).padStart(10)}` : "",
        ];
        return parts.filter(Boolean).join("  ");
    });
    const revenue = withData.reduce((sum, f) => sum + (f.totrevenue ?? 0), 0);
    const byYear = [...withData].sort((a, b) => (b.tax_prd_yr ?? 0) - (a.tax_prd_yr ?? 0));
    const newest = byYear[0] ?? all[0];
    const oldest = byYear[byYear.length - 1] ?? all[all.length - 1];
    const pdfs = all.filter((f) => f.pdf_url).slice(0, 3).map((f) => `  FY ${f.tax_prd_yr}: ${f.pdf_url}`);
    return [
        `Filings for ${o.name} (EIN ${o.ein}):`,
        "",
        `  on record     ${all.length} filing(s) - ${withData.length} with financial data`,
        `  years         ${oldest.tax_prd_yr} to ${newest.tax_prd_yr}`,
        withData.length ? `  total revenue ${money(revenue)} across the ${withData.length} filing(s) with data` : "",
        "",
        "Newest first (form type, revenue and expenses as filed):",
        ...rows,
        ...(pdfs.length ? ["Filing PDFs:", ...pdfs] : []),
        all.length > limit ? `Showing ${limit} of ${all.length}; raise limit for more.` : "",
    ].filter((line) => line !== "").join("\n");
}
// ---- muxF tools:
/**
 * Two questions the org-by-org tools do not answer: how a state's registered
 * nonprofits are distributed across the activity codes they file under, and how
 * stale the filings behind that list are.
 */
const NPE_PAGE_SIZE = 100;
const npMoney = (value) => {
    const n = Number(value);
    if (!Number.isFinite(n))
        return "not reported";
    if (Math.abs(n) >= 1e9)
        return `$${(n / 1e9).toFixed(2)}bn`;
    if (Math.abs(n) >= 1e6)
        return `$${(n / 1e6).toFixed(1)}m`;
    return `$${Math.round(n).toLocaleString("en-US")}`;
};
const npMonthsSince = (iso) => {
    const stamp = Date.parse(iso);
    if (!Number.isFinite(stamp))
        return null;
    return Math.round((Date.now() - stamp) / 2_629_800_000);
};
/** How a state's registered nonprofits spread across the activity codes they file under. */
export async function stateSectorCensus(args) {
    const state = String(args?.state ?? "").trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(state))
        throw new NonprofitError("Give a two-letter state code, e.g. NY.");
    const n = Math.min(Math.max(Number(args?.limit ?? 12) || 12, 1), 40);
    const pages = Math.min(Math.max(Number(args?.pages ?? 2) || 2, 1), 5);
    const rows = [];
    let totalResults = 0;
    for (let pageNo = 0; pageNo < pages; pageNo += 1) {
        const data = await getJson(`/search.json?state%5Bid%5D=${state}${page(pageNo)}`);
        totalResults = data.total_results ?? totalResults;
        const batch = data.organizations ?? [];
        rows.push(...batch);
        if (batch.length < NPE_PAGE_SIZE)
            break;
    }
    if (!rows.length)
        throw new NonprofitError(`ProPublica's nonprofit explorer has no organisations indexed in ${state}.`);
    const byCode = new Map();
    const bySub = new Map();
    const scores = [];
    let noCode = 0;
    for (const org of rows) {
        const code = String(org.ntee_code ?? "").trim();
        if (!code) {
            noCode += 1;
            continue;
        }
        if (!byCode.has(code))
            byCode.set(code, { count: 0, names: [], cities: new Set() });
        const entry = byCode.get(code);
        entry.count += 1;
        if (entry.names.length < 3)
            entry.names.push(org.name);
        if (org.city)
            entry.cities.add(String(org.city));
        const sub = org.subseccd;
        if (sub !== undefined && sub !== null) {
            const key = `${code}-${sub}`;
            if (!bySub.has(key))
                bySub.set(key, { count: 0, subseccd: Number(sub) });
            bySub.get(key).count += 1;
        }
        if (typeof org.score === "number")
            scores.push(org.score);
    }
    if (!byCode.size)
        throw new NonprofitError(`None of the ${rows.length} sampled organisations in ${state} carries an NTEE code.`);
    const ranked = [...byCode.entries()].sort((a, b) => b[1].count - a[1].count);
    const top = ranked[0];
    const medianScore = scores.length ? [...scores].sort((a, b) => a - b)[Math.floor(scores.length / 2)] : null;
    const lines = [
        `NTEE distribution of indexed nonprofits in ${state}: ${rows.length} organisation(s) read${totalResults ? ` of ${totalResults.toLocaleString("en-US")} indexed` : ""}, ${noCode} with no NTEE code`,
        `  ${ranked.length} distinct activity code(s); the largest, ${top[0]}, covers ${top[1].count} organisation(s) (${Math.round((top[1].count / rows.length) * 1000) / 10}% of the sample)`,
        medianScore !== null ? `  relevance score: median ${medianScore.toFixed(1)}${scores.length > 1 ? `, range ${Math.min(...scores).toFixed(1)} to ${Math.max(...scores).toFixed(1)}` : ""}` : "  relevance score: not reported",
        "",
        "  code  orgs  share  cities  example names",
    ];
    for (const [code, entry] of ranked.slice(0, n)) {
        const share = Math.round((entry.count / rows.length) * 1000) / 10;
        lines.push(`  ${code.padEnd(5)}${String(entry.count).padStart(5)}${String(share + "%").padStart(7)}${String(entry.cities.size).padStart(8)}  ${entry.names.join("; ").slice(0, 60)}`);
    }
    if (ranked.length > n)
        lines.push(`  ...and ${ranked.length - n} rarer code(s).`);
    const subRanked = [...bySub.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, 6);
    if (subRanked.length) {
        lines.push("");
        lines.push(`  subdivisions carrying the most: ${subRanked.map(([key, entry]) => `${key} (${entry.count})`).join(", ")}`);
    }
    lines.push("");
    lines.push("  NTEE codes are self-reported on the return; the search relevance score is ProPublica's, not a quality measure.");
    return lines.join("\n");
}
/** How current the filings behind a set of organisations are, and what each return reported. */
export async function filingRecencyAudit(args) {
    const ids = String(args?.eins ?? "")
        .split(/[\s,]+/)
        .map((s) => cleanEin(s))
        .filter(Boolean)
        .slice(0, 12);
    if (!ids.length)
        throw new NonprofitError("Give one to twelve EINs, e.g. 131660611 or 13-1660611.");
    const n = Math.min(Math.max(Number(args?.limit ?? 6) || 6, 1), 12);
    const rows = [];
    for (const ein of ids) {
        const details = await getJson(`/organizations/${ein}.json`);
        const filings = [...(details.filings_with_data ?? []), ...(details.filings_without_data ?? [])];
        const dated = filings
            .filter((f) => f.updated)
            .sort((a, b) => String(b.updated).localeCompare(String(a.updated)));
        const latest = dated[0];
        const forms = [...new Set(filings.map((f) => (f.formtype !== undefined ? String(f.formtype) : "not reported")))];
        rows.push({
            ein,
            name: details.organization?.name ?? `EIN ${ein}`,
            latest,
            count: filings.length,
            withoutData: (details.filings_without_data ?? []).length,
            months: latest?.updated ? npMonthsSince(latest.updated) : null,
            forms,
        });
    }
    const withFilings = rows.filter((r) => r.latest);
    if (!withFilings.length)
        throw new NonprofitError("None of those EINs has a dated filing in the explorer's index.");
    const months = withFilings.map((r) => r.months).sort((a, b) => a - b);
    const stale = withFilings.filter((r) => (r.months ?? 0) > 18);
    const empty = rows.filter((r) => !r.latest);
    const lines = [
        `Filing recency for ${ids.length} EIN(s) from the ProPublica nonprofit explorer`,
        `  ${withFilings.length} with a dated filing, ${empty.length} with none, ${rows.reduce((sum, r) => sum + r.count, 0)} return(s) in total`,
        `  newest filing age: median ${months[Math.floor(months.length / 2)]} month(s), oldest ${months[months.length - 1]} month(s)`,
        `  ${stale.length} organisation(s) have not filed in over 18 months`,
        "",
        "  EIN         latest return   age      revenue      expenses     assets      returns",
    ];
    for (const row of rows.slice(0, n)) {
        const f = row.latest;
        lines.push(`  ${row.ein.padEnd(11)}${f ? String(f.tax_prd_yr ?? "not reported").padEnd(16) : "no dated filing".padEnd(16)}${row.months !== null ? `${row.months} mo`.padEnd(9) : "not reported".padEnd(9)}${npMoney(f?.totrevenue).padEnd(12)}${npMoney(f?.totfuncexpns).padEnd(12)}${npMoney(f?.totassetsend).padEnd(12)}${row.count}`);
    }
    if (rows.length > n)
        lines.push(`  ...and ${rows.length - n} more EIN(s).`);
    if (stale.length) {
        lines.push("");
        lines.push(`  more than 18 months since the last filing: ${stale.map((r) => `${r.ein} ${r.name.slice(0, 28)} (${r.months} mo)`).join("; ")}`);
    }
    const noData = withFilings.filter((r) => r.withoutData > 0);
    if (noData.length) {
        lines.push(`  ${noData.length} organisation(s) have filings with no extracted figures, so the amounts above cover only the returns the explorer parsed.`);
    }
    lines.push("");
    lines.push("  Form types come back as ProPublica's numeric codes; 0 is a Form 990, 1 a 990-EZ and 2 a 990-PF.");
    return lines.join("\n");
}
