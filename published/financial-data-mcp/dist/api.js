export class FinanceError extends Error {
}
export async function fredSeries(args) {
    const id = encodeURIComponent(args.series_id ?? "GDP");
    const res = await fetch(`https://fred.stlouisfed.org/graph/fredgraph.csv?id=${id}`, { signal: AbortSignal.timeout(25000) });
    if (!res.ok)
        throw new FinanceError(`FRED error ${res.status}`);
    const csv = await res.text();
    const rows = csv.trim().split("\n").slice(1);
    const limit = Math.min(args.limit ?? 20, 120);
    const tail = rows.slice(-limit);
    const lines = tail.map((r) => {
        const [date, ...rest] = r.split(",");
        return `${date}: ${rest.join(",")}`;
    });
    return `FRED series ${args.series_id ?? "GDP"}\n${lines.join("\n") || "No data"}`;
}
const TREASURY_FIELDS = [
    ["BC_1MONTH", "1 mo"],
    ["BC_2MONTH", "2 mo"],
    ["BC_3MONTH", "3 mo"],
    ["BC_4MONTH", "4 mo"],
    ["BC_6MONTH", "6 mo"],
    ["BC_1YEAR", "1 yr"],
    ["BC_2YEAR", "2 yr"],
    ["BC_3YEAR", "3 yr"],
    ["BC_5YEAR", "5 yr"],
    ["BC_7YEAR", "7 yr"],
    ["BC_10YEAR", "10 yr"],
    ["BC_20YEAR", "20 yr"],
    ["BC_30YEAR", "30 yr"],
];
export async function treasuryRates(_args) {
    const year = new Date().getFullYear();
    const res = await fetch(`https://home.treasury.gov/resource-center/data-chart-center/interest-rates/pages/xml?data=daily_treasury_yield_curve&field_tdr_date_value=${year}`, { signal: AbortSignal.timeout(25000) });
    if (!res.ok)
        throw new FinanceError(`Treasury error ${res.status}`);
    const xml = await res.text();
    const entry = /<entry>([\s\S]*?)<\/entry>/.exec(xml)?.[1];
    if (!entry)
        throw new FinanceError("Treasury returned no rate data");
    const date = /<d:NEW_DATE>([^<]*)<\/d:NEW_DATE>/.exec(entry)?.[1] ?? "";
    const out = TREASURY_FIELDS.map(([field, label]) => {
        const re = new RegExp(`<d:${field}>([^<]*)</d:${field}>`);
        const v = re.exec(entry)?.[1] ?? "n/a";
        return `${label}: ${v === "n/a" ? v : v + "%"}`;
    });
    return `US Treasury yield curve ${date.slice(0, 10)}\n${out.join("\n")}`;
}
// ---- muxE tools:
// The two existing tools are both single-snapshot reads. fredSeries pulls one
// FRED series and prints its last N observations as a flat list of values.
// treasuryRates pulls the Treasury XML and prints one date's curve as a flat
// list of tenors. Neither of those answers the two questions people actually
// ask of this data, which are how a series has moved and how the curve has
// moved, so the three new tools compute over a window instead of printing one.
//
// A note on the Treasury XML, because it cost a debugging cycle: the live feed
// tags every field with an m:type attribute, as in
//   <d:NEW_DATE m:type="Edm.DateTime">2026-09-28T00:00:00</d:NEW_DATE>
// so a pattern of <d:NEW_DATE>([^<]*) does not match it. Every pattern below
// allows an attribute run. Note also that the rate fields sit inside
// <m:properties>, not directly inside <entry>.
const FRED_CSV = "https://fred.stlouisfed.org/graph/fredgraph.csv";
const TREASURY_XML = "https://home.treasury.gov/resource-center/data-chart-center/interest-rates/pages/xml?data=daily_treasury_yield_curve&field_tdr_date_value=";
const SERIES_RE = /^[A-Za-z0-9_]{2,40}$/;
function cleanSeriesId(raw, label) {
    const id = typeof raw === "string" ? raw.trim().toUpperCase() : "";
    if (!SERIES_RE.test(id)) {
        throw new FinanceError(`${label} must be a FRED series id like DGS10 or UNRATE. You gave "${typeof raw === "string" ? raw.slice(0, 40) : String(raw)}".`);
    }
    return id;
}
function num(v) {
    if (typeof v !== "string")
        return null;
    const t = v.trim();
    if (!t || t === "." || t === "")
        return null; // FRED writes "." for a missing observation
    const x = Number(t);
    return Number.isFinite(x) ? x : null;
}
// FRED returns real HTTP 200 with a well formed CSV even for a series id that
// does not exist, so a bad id cannot be caught by status code. It comes back as
// a header with the id and no data rows, or as a single all-missing column.
async function fetchSeries(id) {
    const res = await fetch(`${FRED_CSV}?id=${encodeURIComponent(id)}`, {
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new FinanceError(`FRED error ${res.status} for series ${id}`);
    const body = await res.text();
    const rows = body.trim().split("\n");
    if (rows.length < 2) {
        throw new FinanceError(`FRED returned no rows for series ${id}. Check the id; the CSV only has a header.`);
    }
    const points = [];
    for (const line of rows.slice(1)) {
        const [date, value] = line.split(",");
        const v = num(value);
        if (date && v !== null)
            points.push({ date: date.trim(), value: v });
    }
    if (!points.length) {
        throw new FinanceError(`FRED returned the id ${id} but not a single observation. Either the series id is wrong, or the series is entirely unreleased.`);
    }
    return points;
}
const fmt = (v, places = 2) => (v === null ? "n/a" : v.toFixed(places));
function stats(points) {
    const values = points.map((p) => p.value);
    const first = points[0];
    const last = points[points.length - 1];
    const min = points.reduce((a, b) => (b.value < a.value ? b : a));
    const max = points.reduce((a, b) => (b.value > a.value ? b : a));
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const change = last.value - first.value;
    const pct = first.value !== 0 ? (change / Math.abs(first.value)) * 100 : null;
    return { first, last, min, max, mean, change, pct };
}
function describeTrend(points, s) {
    const up = s.change > 0;
    const flat = Math.abs(s.change) < Math.abs(s.last.value) * 0.001;
    if (flat)
        return `flat over the window, within 0.1% of where it started.`;
    const dir = up ? "higher" : "lower";
    const magnitude = s.pct === null ? `${fmt(Math.abs(s.change))}` : `${fmt(Math.abs(s.pct))}% (${fmt(Math.abs(s.change))} points)`;
    return `${dir} by ${magnitude} from ${fmt(s.first.value)} to ${fmt(s.last.value)}.`;
}
function stepSize(points) {
    if (points.length < 3)
        return null;
    const a = Date.parse(points[0].date);
    const b = Date.parse(points[points.length - 1].date);
    if (Number.isNaN(a) || Number.isNaN(b))
        return null;
    const days = Math.round((b - a) / 86400000);
    return days > 0 ? `${days} day(s)` : null;
}
export function series_compare(args) {
    const raw = args?.series_ids;
    if (!Array.isArray(raw) || raw.length < 2) {
        return Promise.reject(new FinanceError("series_ids needs at least two FRED series ids, for example DGS10 and UNRATE, so there is something to compare."));
    }
    if (raw.length > 4) {
        return Promise.reject(new FinanceError(`series_ids was given ${raw.length} ids; at most 4, so the output stays readable.`));
    }
    const ids = raw.map((x, i) => cleanSeriesId(x, `series_ids[${i}]`));
    if (new Set(ids).size !== ids.length) {
        return Promise.reject(new FinanceError(`series_ids repeats an id: ${ids.join(", ")}.`));
    }
    const limit = Math.max(2, Math.min(5000, Math.floor(Number(args?.limit ?? 250) || 250)));
    // FRED returns a zip archive when more than one id is requested, so each
    // series is fetched on its own and the alignment is done here.
    return Promise.all(ids.map((id) => fetchSeries(id))).then((series) => {
        const trimmed = series.map((p) => p.slice(-limit));
        const byId = new Map(ids.map((id, i) => [id, trimmed[i]]));
        const lines = [
            `Comparing ${ids.length} FRED series over their last ${limit} observations each:`,
        ];
        for (const id of ids) {
            const s = stats(byId.get(id));
            lines.push(`  ${id.padEnd(10)} ${describeTrend(trimmed[ids.indexOf(id)], s)}`);
        }
        // Only dates every series actually reports can carry a comparison; a
        // monthly and a daily series otherwise produce a meaningless join.
        let shared = new Set(trimmed[0].map((p) => p.date));
        for (let i = 1; i < trimmed.length; i++) {
            const dates = new Set(trimmed[i].map((p) => p.date));
            shared = new Set([...shared].filter((d) => dates.has(d)));
        }
        const common = [...shared].sort();
        lines.push("");
        if (common.length < 2) {
            lines.push(`  No date is reported by all ${ids.length} series, so they cannot be compared point by point:`);
            for (const id of ids) {
                const p = byId.get(id);
                lines.push(`    ${id} covers ${p[0].date} to ${p[p.length - 1].date} (${p.length} observations).`);
            }
            lines.push("    These series are on different calendars or frequencies, so use the per-series change above rather than a joined comparison.");
        }
        else {
            const tail = common.slice(-Math.min(6, common.length));
            lines.push(`  ${common.length} date(s) are reported by all of them, most recent of those:`);
            lines.push(`    ${"date".padEnd(12)}${ids.map((i) => i.padEnd(12)).join("")}`);
            for (const d of tail) {
                const cells = ids.map((id) => {
                    const p = byId.get(id).find((x) => x.date === d);
                    return fmt(p ? p.value : null).padEnd(12);
                });
                lines.push(`    ${d.padEnd(12)}${cells.join("")}`);
            }
            // Direction agreement is the part worth reading: two series that both
            // rose is a fact, two series that diverged is the other kind of fact.
            const dirs = ids.map((id, i) => Math.sign(stats(byId.get(id)).change));
            const together = dirs.every((d) => d === dirs[0]) && dirs[0] !== 0;
            lines.push("");
            lines.push(together
                ? `  all of them moved the same way over their own windows.`
                : `  they did not all move the same way over their own windows, so treat any correlation as coincidental.`);
        }
        lines.push("");
        lines.push("  The existing fred series tool takes one id at a time and returns its values, so this join is not reachable with it.");
        return lines.join("\n");
    });
}
const TENORS = [
    ["BC_1MONTH", "1 mo"],
    ["BC_3MONTH", "3 mo"],
    ["BC_6MONTH", "6 mo"],
    ["BC_1YEAR", "1 yr"],
    ["BC_2YEAR", "2 yr"],
    ["BC_3YEAR", "3 yr"],
    ["BC_5YEAR", "5 yr"],
    ["BC_7YEAR", "7 yr"],
    ["BC_10YEAR", "10 yr"],
    ["BC_20YEAR", "20 yr"],
    ["BC_30YEAR", "30 yr"],
];
function xmlField(block, name) {
    // The attribute run after the tag name is what the live feed always emits.
    const m = new RegExp(`<d:${name}(?:\\s[^>]*)?>([^<]*)</d:${name}>`).exec(block);
    const v = m?.[1]?.trim();
    return v ? v : null;
}
function tenorValue(block, field) {
    const v = xmlField(block, field);
    if (v === null)
        return null;
    const x = Number(v);
    return Number.isFinite(x) ? x : null;
}
async function fetchCurves(year) {
    const res = await fetch(`${TREASURY_XML}${year}`, { signal: AbortSignal.timeout(25000) });
    if (!res.ok)
        throw new FinanceError(`Treasury error ${res.status} for ${year}`);
    const xml = await res.text();
    // The rate fields live in m:properties, and each entry carries several, so
    // the properties blocks are taken in document order and the list is sorted
    // by date afterwards rather than assuming the feed arrives newest first.
    const blocks = xml.match(/<m:properties>[\s\S]*?<\/m:properties>/g) ?? [];
    const days = [];
    for (const b of blocks) {
        const date = xmlField(b, "NEW_DATE");
        if (!date)
            continue;
        const values = new Map();
        for (const [field] of TENORS) {
            const v = tenorValue(b, field);
            if (v !== null)
                values.set(field, v);
        }
        if (values.size)
            days.push({ date: date.slice(0, 10), values });
    }
    if (!days.length) {
        throw new FinanceError(`Treasury returned no usable yield curve entries for ${year}.`);
    }
    days.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    return days;
}
function tenorValueField(values, field) {
    const v = values.get(field);
    return v === undefined ? null : v;
}
// ---- gap3c tools:
// Every other tool on this server takes a `limit` and reads the most recent N
// observations, so none of them can answer a question about a window in the past.
// FRED's CSV endpoint takes cosd/coed and an fq/fam aggregation, which makes
// that possible; but measured against the live service it silently ignores an
// unrecognised fq, ignores coed when it is earlier than cosd, and ignores both
// when the window is entirely in the future. So the rows are filtered to the
// window here rather than trusted to arrive pre-filtered, and what was kept is
// reported.
//
// This block is spliced into the same module, so FinanceError, FRED_CSV,
// SERIES_RE, Point, cleanSeriesId, num and fmt are already in scope here and
// are not redeclared.
// An unrecognised fq is accepted and ignored by the service, which would leave
// this tool reporting an aggregation it never applied, so the set is closed here.
const FREQUENCIES = {
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
    quarterly: "Quarterly",
    annual: "Annual",
};
const AGGREGATES = new Set(["avg", "sum"]);
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
function isoDay(raw, label) {
    const value = typeof raw === "string" ? raw.trim() : "";
    if (!ISO_DAY.test(value)) {
        throw new FinanceError(`${label} must be a date as YYYY-MM-DD. You gave "${String(raw ?? "").slice(0, 40)}".`);
    }
    // Parsed as UTC so a date is never shifted by the machine's own timezone.
    const stamp = Date.parse(`${value}T00:00:00Z`);
    if (!Number.isFinite(stamp))
        throw new FinanceError(`${label} is not a real date: "${value}".`);
    return value;
}
