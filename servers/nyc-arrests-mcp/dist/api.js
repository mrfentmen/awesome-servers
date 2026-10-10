export class NycArrestsError extends Error {
    constructor(message) {
        super(message);
        this.name = "NycArrestsError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
const YTD = "https://data.cityofnewyork.us/resource/uip8-fykc.json";
const HIST = "https://data.cityofnewyork.us/resource/8h9b-rp9u.json";
const BOROS = {
    manhattan: "M", brooklyn: "K", queens: "Q", bronx: "B", staten: "S",
};
function headers() {
    const h = { ...UA, Accept: "application/json" };
    if (process.env.NYC_APP_TOKEN)
        h["X-App-Token"] = process.env.NYC_APP_TOKEN;
    return h;
}
function boro(v) {
    if (!v)
        return null;
    const t = v.trim().toLowerCase();
    if (t.length === 1)
        return t.toUpperCase();
    for (const [k, code] of Object.entries(BOROS)) {
        if (t.startsWith(k))
            return code;
    }
    return null;
}
function clauses(filters) {
    return filters.length ? `$where=${encodeURIComponent(filters.join(" AND "))}&` : "";
}
function baseFilters(opts) {
    const f = [];
    const b = boro(opts.borough);
    if (b)
        f.push(`arrest_boro='${b}'`);
    if (opts.offense) {
        const o = opts.offense.trim().replace(/'/g, "''").toUpperCase();
        f.push(`(upper(ofns_desc) like '%${o}%' OR upper(pd_desc) like '%${o}%')`);
    }
    if (opts.from)
        f.push(`arrest_date >= '${opts.from}T00:00:00'`);
    if (opts.to)
        f.push(`arrest_date <= '${opts.to}T23:59:59'`);
    if (opts.age)
        f.push(`age_group='${opts.age.trim().toUpperCase()}'`);
    if (opts.sex)
        f.push(`perp_sex='${opts.sex.trim().toUpperCase()}'`);
    return f;
}
async function query(base, extra) {
    let res;
    try {
        res = await fetch(base + "?" + extra, { headers: headers(), signal: AbortSignal.timeout(30000) });
    }
    catch (e) {
        throw new NycArrestsError(`Network error: ${e.message}`);
    }
    if (!res.ok) {
        const body = (await res.text()).slice(0, 300);
        throw new NycArrestsError(`HTTP ${res.status}: ${body}`);
    }
    return (await res.text()).slice(0, 14000);
}
function slim(t) {
    try {
        const rows = JSON.parse(t);
        if (!Array.isArray(rows))
            return t.slice(0, 4000);
        return JSON.stringify(rows.map((r) => ({
            key: r.arrest_key, date: r.arrest_date, offense: r.ofns_desc ?? r.pd_desc,
            law: r.law_code, category: r.law_cat_cd, boro: r.arrest_boro, precinct: r.arrest_precinct,
            age: r.age_group, sex: r.perp_sex, race: r.perp_race, lat: r.latitude, lon: r.longitude,
        })), null, 2).slice(0, 12000);
    }
    catch {
        return t.slice(0, 4000);
    }
}
export function searchArrests(opts) {
    const n = Math.min(Number(opts.limit ?? 20) || 20, 100);
    return query(YTD, `${clauses(baseFilters(opts))}$limit=${n}&$order=arrest_date DESC`).then(slim);
}
export function arrestDetails(arrestKey) {
    return query(YTD, `$where=${encodeURIComponent(`arrest_key='${arrestKey.trim()}'`)}`).then(slim);
}
export function historicSearch(opts) {
    const n = Math.min(Number(opts.limit ?? 20) || 20, 100);
    return query(HIST, `${clauses(baseFilters(opts))}$limit=${n}&$order=arrest_date DESC`).then(slim);
}
export function topOffenses(borough, limit) {
    const n = Math.min(Number(limit ?? 10) || 10, 25);
    const b = boro(borough);
    const where = b ? `$where=${encodeURIComponent(`arrest_boro='${b}'`)}&` : "";
    return query(YTD, `${where}$select=${encodeURIComponent("ofns_desc,count(arrest_key)")}&$group=${encodeURIComponent("ofns_desc")}&$order=${encodeURIComponent("count_arrest_key DESC")}&$limit=${n}`);
}
export function precinctActivity(precinct, limit) {
    const n = Math.min(Number(limit ?? 20) || 20, 100);
    const p = precinct.trim();
    return query(YTD, `$where=${encodeURIComponent(`arrest_precinct='${p}'`)}&$limit=${n}&$order=arrest_date DESC`).then(slim);
}
export function boroughStats(borough) {
    const b = boro(borough) ?? borough.trim().toUpperCase();
    return query(YTD, `$where=${encodeURIComponent(`arrest_boro='${b}'`)}&$select=${encodeURIComponent("law_cat_cd,count(arrest_key)")}&$group=${encodeURIComponent("law_cat_cd")}`);
}
export function recentFelonies(limit) {
    const n = Math.min(Number(limit ?? 20) || 20, 100);
    return query(YTD, `$where=${encodeURIComponent("law_cat_cd='F'")}&$limit=${n}&$order=arrest_date DESC`).then(slim);
}
export function recentMisdemeanors(limit) {
    const n = Math.min(Number(limit ?? 20) || 20, 100);
    return query(YTD, `$where=${encodeURIComponent("law_cat_cd='M'")}&$limit=${n}&$order=arrest_date DESC`).then(slim);
}
export function offenseLookup(pdCode, limit) {
    const n = Math.min(Number(limit ?? 20) || 20, 100);
    return query(YTD, `$where=${encodeURIComponent(`pd_cd='${pdCode.trim()}'`)}&$limit=${n}&$order=arrest_date DESC`).then(slim);
}
export function arrestMapData(latMin, latMax, lonMin, lonMax, limit) {
    const n = Math.min(Number(limit ?? 50) || 50, 200);
    const w = `latitude between ${latMin} and ${latMax} AND longitude between ${lonMin} and ${lonMax}`;
    return query(YTD, `$where=${encodeURIComponent(w)}&$limit=${n}&$order=arrest_date DESC`).then(slim);
}
// ---- muxA tools:
// The existing tools read individual rows. These add the aggregate view the
// Socrata backend can produce on its own, so a trend or a borough by category
// count is one request instead of thousands of rows counted client side.
const NYCA_YTD = "https://data.cityofnewyork.us/resource/uip8-fykc.json";
const NYCA_HIST = "https://data.cityofnewyork.us/resource/8h9b-rp9u.json";
// The only codes that actually appear in the current-year dataset, read live:
// M 82,929 / F 55,651 / V 1,896 / no code at all 864 / "9" 426 / I 99 /
// the literal string "(null)" 5, out of 141,870 rows for 2026 to 2026-06-30.
const NYCA_CATEGORY = {
    F: "felony",
    M: "misdemeanor",
    V: "violation",
    I: "infraction",
};
// Read live: the borough field only ever holds K, B, M, Q and S.
const NYCA_BOROUGH = {
    K: "Brooklyn",
    B: "Bronx",
    M: "Manhattan",
    Q: "Queens",
    S: "Staten Island",
};
// The date_trunc names that answer 200 on this backend. date_trunc_yw and
// date_trunc_q both fail with query.soql.no-such-function, so they are absent.
const NYCA_GRAIN = {
    day: "date_trunc_ymd",
    month: "date_trunc_ym",
    year: "date_trunc_y",
};
function nycaCategoryLabel(code) {
    if (typeof code !== "string" || code.length === 0)
        return "not classified, no code recorded";
    // The source data carries two different kinds of empty: a missing code and
    // the literal text "(null)". They are counted separately rather than merged.
    if (code === "(null)")
        return "not classified, code stored as the text (null)";
    const known = NYCA_CATEGORY[code];
    return known ? `${code} ${known}` : `${code} (not a standard NY category code)`;
}
function nycaBoroughLabel(code) {
    if (typeof code !== "string" || code.length === 0 || code === "(null)")
        return "borough not recorded";
    return NYCA_BOROUGH[code] ? `${NYCA_BOROUGH[code]} (${code})` : `code ${code}`;
}
// Socrata answers aggregated rows as strings, and an ungrouped null arrives as
// a missing key rather than as a null value, so every number is parsed here
// instead of being trusted.
function nycaNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
}
const NYCA_DATE = /^\d{4}-\d{2}-\d{2}$/;
function nycaDate(value, field) {
    const trimmed = value.trim();
    if (!NYCA_DATE.test(trimmed))
        throw new NycArrestsError(`${field} must be YYYY-MM-DD, got "${value}".`);
    return trimmed;
}
async function nycaAgg(base, params, slowHint) {
    const qs = new URLSearchParams();
    for (const [key, value] of params)
        qs.append(key, value);
    let res;
    try {
        res = await fetch(`${base}?${qs.toString()}`, { headers: headers(), signal: AbortSignal.timeout(45000) });
    }
    catch (e) {
        throw new NycArrestsError(`${e.message}. ${slowHint}`);
    }
    const body = (await res.json().catch(() => null));
    if (!res.ok) {
        // A rejected column or function answers {"message": "...", "errorCode": "..."}
        // with the real reason, which beats a bare status code.
        const detail = body && typeof body === "object" && typeof body.message === "string"
            ? String(body.message)
            : `HTTP ${res.status}`;
        throw new NycArrestsError(detail);
    }
    if (!Array.isArray(body))
        throw new NycArrestsError("NYC Open Data answered with a body that is not a row list.");
    return body;
}
async function nycaSpan(base) {
    const rows = await nycaAgg(base, [["$select", "min(arrest_date),max(arrest_date),count(arrest_key)"]], "Try again shortly.");
    const row = rows[0] ?? {};
    return {
        from: String(row.min_arrest_date ?? "?").slice(0, 10),
        to: String(row.max_arrest_date ?? "?").slice(0, 10),
        rows: nycaNumber(row.count_arrest_key),
    };
}
export async function datasetCoverage() {
    const current = await nycaSpan(NYCA_YTD);
    const historic = await nycaSpan(NYCA_HIST);
    const categories = await nycaAgg(NYCA_YTD, [
        ["$select", "law_cat_cd,count(arrest_key) as n"],
        ["$group", "law_cat_cd"],
        ["$order", "n DESC"],
    ], "Try again shortly.");
    const total = categories.reduce((sum, row) => sum + nycaNumber(row.n), 0);
    const lines = [
        "NYPD arrest data on NYC Open Data. Both files are read without an app token: the token raises the rate limit, it is not required.",
        "",
        `Current year file (uip8-fykc): records ${current.from} to ${current.to}, ${current.rows.toLocaleString()} arrests`,
        `Historic file (8h9b-rp9u): records ${historic.from} to ${historic.to}, ${historic.rows.toLocaleString()} arrests`,
        "",
        // The current-year file is not actually current: its last record is months
        // behind, verified live, so a tool that looks empty may just be past the end.
        "The current year file is not updated in real time, so its last recorded day can be well behind today. A search that returns nothing near today is usually reading past the end of the data.",
        "",
        "Arrest category codes as they appear in the current year file:",
        ...categories.map((row) => `  ${nycaCategoryLabel(row.law_cat_cd)} - ${nycaNumber(row.n).toLocaleString()} (${((nycaNumber(row.n) / total) *
            100).toFixed(1)}%)`),
        "",
        "The public files carry no names: age group, sex and race are recorded, and coordinates are rounded to the block.",
    ];
    return lines.join("\n");
}
// The historic file holds over six million rows and every attempt to group it
// by month or year was killed by the 45 second timeout, so trends are read from
// the current year file only. The historic file is still reachable row by row
// through the existing historic_search tool.
export async function arrestTrend(args) {
    const grain = (args.granularity ?? "month").trim().toLowerCase();
    const trunc = NYCA_GRAIN[grain];
    if (!trunc)
        throw new NycArrestsError(`Granularity must be one of ${Object.keys(NYCA_GRAIN).join(", ")}, got "${args.granularity}".`);
    const base = NYCA_YTD;
    const from = args.from ? nycaDate(args.from, "from") : "";
    const to = args.to ? nycaDate(args.to, "to") : "";
    const filters = baseFilters({ borough: args.borough, offense: args.offense, from, to });
    const category = (args.category ?? "").trim().toUpperCase();
    if (category)
        filters.push(`law_cat_cd='${category.replace(/'/g, "''")}'`);
    const params = [
        ["$select", `${trunc}(arrest_date) as bucket,count(arrest_key) as n`],
        ["$group", "bucket"],
        ["$order", "bucket"],
        ["$limit", "5000"],
    ];
    if (filters.length)
        params.push(["$where", filters.join(" AND ")]);
    const rows = await nycaAgg(base, params, "Try a narrower date range.");
    if (!rows.length) {
        const span = await nycaSpan(base);
        return `No arrests match in the current year file, which records ${span.from} to ${span.to}. A range outside that span is the usual cause.`;
    }
    const buckets = rows.map((row) => ({ when: String(row.bucket ?? "?").slice(0, 10), n: nycaNumber(row.n) }));
    const total = buckets.reduce((sum, b) => sum + b.n, 0);
    const peak = buckets.reduce((best, b) => (b.n > best.n ? b : best), buckets[0]);
    const low = buckets.reduce((worst, b) => (b.n < worst.n ? b : worst), buckets[0]);
    const mean = total / buckets.length;
    const described = [
        args.borough ? `borough ${args.borough}` : "",
        args.offense ? `offense containing "${args.offense}"` : "",
        category ? `category ${nycaCategoryLabel(category)}` : "",
        from ? `from ${from}` : "",
        to ? `to ${to}` : "",
    ].filter(Boolean);
    const shown = buckets.slice(-60);
    const head = [
        `Arrests per ${grain} in the current year file${described.length ? ` (${described.join(", ")})` : ""}`,
        `${total.toLocaleString()} arrests across ${buckets.length} ${grain}${buckets.length === 1 ? "" : "s"}, averaging ${mean.toLocaleString("en-US", { maximumFractionDigits: 1 })}`,
        `Busiest ${grain} ${peak.when} with ${peak.n.toLocaleString()}, quietest ${low.when} with ${low.n.toLocaleString()}`,
        buckets.length > shown.length ? `Showing the most recent ${shown.length} entries of ${buckets.length}:` : "Every entry:",
    ];
    return [...head, ...shown.map((b) => `  ${b.when}  ${b.n.toLocaleString()}`)].join("\n");
}
export async function boroughCategoryMatrix(args) {
    const from = args.from ? nycaDate(args.from, "from") : "";
    const to = args.to ? nycaDate(args.to, "to") : "";
    const filters = baseFilters({ offense: args.offense, from, to });
    const params = [
        ["$select", "arrest_boro,law_cat_cd,count(arrest_key) as n"],
        ["$group", "arrest_boro,law_cat_cd"],
        ["$order", "n DESC"],
    ];
    if (filters.length)
        params.push(["$where", filters.join(" AND ")]);
    const rows = await nycaAgg(NYCA_YTD, params, "Try a narrower date range.");
    const boroughs = new Map();
    const categoryCodes = new Set();
    for (const row of rows) {
        const boroCode = typeof row.arrest_boro === "string" ? row.arrest_boro : "";
        const catCode = typeof row.law_cat_cd === "string" && row.law_cat_cd !== "(null)" ? row.law_cat_cd : "";
        const entry = boroughs.get(boroCode) ?? { label: nycaBoroughLabel(boroCode), counts: new Map(), total: 0 };
        const n = nycaNumber(row.n);
        entry.counts.set(catCode, (entry.counts.get(catCode) ?? 0) + n);
        entry.total += n;
        boroughs.set(boroCode, entry);
        categoryCodes.add(catCode);
    }
    if (!boroughs.size)
        return "No arrests match those filters in the current year file.";
    const categories = Array.from(categoryCodes).sort((a, b) => rows.reduce((s, r) => s + (String(r.law_cat_cd ?? "") === b ? nycaNumber(r.n) : 0), 0) -
        rows.reduce((s, r) => s + (String(r.law_cat_cd ?? "") === a ? nycaNumber(r.n) : 0), 0));
    const grand = Array.from(boroughs.values()).reduce((sum, entry) => sum + entry.total, 0);
    const described = [args.offense ? `offense containing "${args.offense}"` : "", from ? `from ${from}` : "", to ? `to ${to}` : ""].filter(Boolean);
    const lines = [
        `Arrests by borough and category in the current year file${described.length ? ` (${described.join(", ")})` : ""}`,
        `${grand.toLocaleString()} arrests in total`,
        "",
        `columns: ${categories.map((code) => nycaCategoryLabel(code)).join(" | ")}`,
        "",
        ...Array.from(boroughs.entries())
            .sort((a, b) => b[1].total - a[1].total)
            .map(([, entry]) => {
            const cells = categories.map((code) => (entry.counts.get(code) ?? 0).toLocaleString().padStart(9));
            return `${entry.label.padEnd(20)} ${cells.join("")}   total ${entry.total.toLocaleString()}`;
        }),
        "",
        "The current year file ends months before today, so recent weeks are not represented.",
    ];
    return lines.join("\n");
}
