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
// Socrata answers aggregated rows as strings, and an ungrouped null arrives as
// a missing key rather than as a null value, so every number is parsed here
// instead of being trusted.
function nycaNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
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
const NYCA_BOROUGH_NAMES = { M: "Manhattan", K: "Brooklyn", Q: "Queens", B: "Bronx", S: "Staten Island" };
const nycaBoroughCode = (value) => {
    const raw = String(value ?? "").trim();
    if (!raw)
        return null;
    const upper = raw.toUpperCase();
    if (NYCA_BOROUGH_NAMES[upper])
        return upper;
    const hit = Object.entries(NYCA_BOROUGH_NAMES).find(([, name]) => name.toLowerCase() === raw.toLowerCase());
    return hit ? hit[0] : null;
};
const nycaWhere = (args) => {
    const filters = [];
    const boro = nycaBoroughCode(args?.borough);
    if (args?.borough && !boro)
        throw new NycArrestsError(`"${args.borough}" is not a borough; use Manhattan, Brooklyn, Queens, Bronx, Staten Island, or M, K, Q, B, S.`);
    if (boro)
        filters.push(`arrest_boro='${boro}'`);
    const offense = String(args?.offense ?? "").trim();
    if (offense)
        filters.push(`upper(ofns_desc) like '%${offense.toUpperCase().replace(/'/g, "")}%'`);
    const category = String(args?.category ?? "").trim().toUpperCase();
    if (category)
        filters.push(`law_cat_cd='${category.replace(/[^A-Z]/g, "")}'`);
    const from = String(args?.from ?? "").trim();
    const to = String(args?.to ?? "").trim();
    if (from)
        filters.push(`arrest_date >= '${from}T00:00:00'`);
    if (to)
        filters.push(`arrest_date <= '${to}T23:59:59'`);
    return filters;
};
/** Arrest counts bucketed by day, month or year, with the shape of the series. */
export async function arrestTrend(args) {
    const granularity = String(args?.granularity ?? "month").trim().toLowerCase();
    const bucketOf = { day: "date_trunc_ymd", month: "date_trunc_ym", year: "date_trunc_y" };
    const fn = bucketOf[granularity];
    if (!fn)
        throw new NycArrestsError(`granularity must be day, month or year, not "${args?.granularity}".`);
    const filters = nycaWhere(args);
    const params = [
        ["$select", `${fn}(arrest_date) as bucket,count(arrest_key) as n`],
        ["$group", "bucket"],
        ["$order", "bucket"],
        ["$limit", "5000"],
    ];
    if (filters.length)
        params.unshift(["$where", filters.join(" AND ")]);
    const rows = await nycaAgg(NYCA_YTD, params, "The current-year file is smaller than the historic one, so this is a genuine failure rather than slowness.");
    if (!rows.length)
        throw new NycArrestsError("No arrest in the current-year file matches those filters. The current file covers this year only; use historic_search for older dates.");
    const series = rows
        .map((row) => ({ bucket: String(row.bucket ?? "").slice(0, granularity === "year" ? 4 : granularity === "month" ? 7 : 10), count: nycaNumber(row.n) }))
        .filter((row) => row.bucket);
    const total = series.reduce((sum, row) => sum + row.count, 0);
    const busiest = series.reduce((a, b) => (b.count > a.count ? b : a));
    const quietest = series.reduce((a, b) => (b.count < a.count ? b : a));
    const average = total / series.length;
    const values = series.map((r) => r.count);
    const sd = Math.sqrt(values.reduce((sum, v) => sum + (v - average) ** 2, 0) / values.length);
    const label = filters.length ? ` (${filters.join(" AND ")})` : "";
    const show = series.slice(-24);
    return [
        `Arrests in the current-year file, by ${granularity}${label}`,
        `  ${series.length} period(s), ${total.toLocaleString("en-US")} arrest(s) between ${series[0].bucket} and ${series[series.length - 1].bucket}`,
        `  average          ${average.toFixed(1)} per ${granularity}, standard deviation ${sd.toFixed(1)}`,
        `  busiest          ${busiest.bucket} with ${busiest.count.toLocaleString("en-US")}`,
        `  quietest         ${quietest.bucket} with ${quietest.count.toLocaleString("en-US")}`,
        "",
        `Series${series.length > show.length ? ` (last ${show.length} of ${series.length})` : ""}:`,
        ...show.map((row) => `  ${row.bucket}  ${String(row.count).padStart(6)}  ${"#".repeat(Math.max(0, Math.round((row.count / Math.max(...values)) * 40)))}`),
        "",
        "note: the current-year file is updated as reports are entered, so the most recent period is always incomplete and will look quiet for that reason alone. A day is counted by arrest date, not by when the report was filed.",
    ].join("\n");
}
/** Borough against charge category, as one matrix. */
export async function boroughCategoryMatrix(args) {
    const filters = nycaWhere(args);
    const params = [
        ["$select", "arrest_boro,law_cat_cd,count(arrest_key) as n"],
        ["$group", "arrest_boro,law_cat_cd"],
        ["$order", "arrest_boro"],
        ["$limit", "500"],
    ];
    if (filters.length)
        params.unshift(["$where", filters.join(" AND ")]);
    const rows = await nycaAgg(NYCA_YTD, params, "The current-year file is smaller than the historic one, so this is a genuine failure rather than slowness.");
    if (!rows.length)
        throw new NycArrestsError("No arrest in the current-year file matches those filters, so there is no matrix to build.");
    const boroughs = [...new Set(rows.map((r) => String(r.arrest_boro ?? "?")))].sort();
    const categories = [...new Set(rows.map((r) => String(r.law_cat_cd ?? "?")))].sort();
    const cell = new Map(rows.map((r) => [`${r.arrest_boro}|${r.law_cat_cd}`, nycaNumber(r.n)]));
    const totals = new Map(boroughs.map((b) => [b, categories.reduce((sum, c) => sum + (cell.get(`${b}|${c}`) ?? 0), 0)]));
    const grand = [...totals.values()].reduce((a, b) => a + b, 0);
    const header = `  ${"borough".padEnd(14)}${categories.map((c) => c.padStart(8)).join("")}${"total".padStart(10)}`;
    const body = boroughs.map((b) => {
        const total = totals.get(b) ?? 0;
        return `  ${`${b} ${NYCA_BOROUGH_NAMES[b] ?? ""}`.slice(0, 13).padEnd(14)}${categories.map((c) => String(cell.get(`${b}|${c}`) ?? 0).padStart(8)).join("")}${String(total).padStart(10)}`;
    });
    const footer = `  ${"all".padEnd(14)}${categories.map((c) => String(boroughs.reduce((sum, b) => sum + (cell.get(`${b}|${c}`) ?? 0), 0)).padStart(8)).join("")}${String(grand).padStart(10)}`;
    const shares = boroughs.map((b) => `${NYCA_BOROUGH_NAMES[b] ?? b} ${(((totals.get(b) ?? 0) / grand) * 100).toFixed(1)}%`);
    return [
        `Arrests by borough and charge category in the current-year file${filters.length ? ` (${filters.join(" AND ")})` : ""}`,
        `  ${grand.toLocaleString("en-US")} arrest(s) across ${boroughs.length} borough(s)`,
        "",
        header,
        ...body,
        footer,
        "",
        `Share of the total: ${shares.join(", ")}`,
        "",
        `Categories: ${categories.join(", ")} — single letters are the charge class in the source (F felony, M misdemeanor, V violation), not offence names.`,
        "",
        "note: borough is the arresting command, which is where the arrest was made rather than where the person lives, and a matrix built from the current-year file says nothing about earlier years.",
    ].join("\n");
}
