export class FbiError extends Error {
    constructor(message) {
        super(message);
        this.name = "FbiError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
function key() {
    const k = process.env.FBI_API_KEY;
    if (!k)
        throw new FbiError("Set FBI_API_KEY (free api.data.gov signup).");
    return k;
}
async function get(dataset, state) {
    let res;
    try {
        res = await fetch(`https://api.usa.gov/crime/fbi/cde/${dataset}/states/${encodeURIComponent(state)}/all?API_KEY=${encodeURIComponent(key())}`, {
            headers: { ...UA, Accept: "application/json" },
            signal: AbortSignal.timeout(25000),
        });
    }
    catch (e) {
        throw new FbiError(`Network error: ${e.message}`);
    }
    if (!res.ok) {
        const body = (await res.text()).slice(0, 300);
        throw new FbiError(`HTTP ${res.status}: ${body}`);
    }
    return (await res.text()).slice(0, 12000);
}
export function arrests(state) {
    return get("arrest", state);
}
export function offenses(state) {
    return get("offense", state);
}
export function victims(state) {
    return get("victim", state);
}
// ---- muxD tools:
/**
 * The FBI Crime Data Explorer on api.data.gov checks the key before the route,
 * so a 403 is returned for every path and no routing probe is possible. What it
 * does distinguish is why: API_KEY_MISSING when none was sent, API_KEY_INVALID
 * when the wrong one was. That is surfaced rather than collapsed into a status.
 *
 * The documented route is /cde/<dataset>/state/<state>/all. The three existing
 * tools in this server call /cde/<dataset>/states/<state>/all, with "states",
 * which is not the documented shape. That is recorded as a suspicion, not a
 * finding, because without a key neither form can be executed.
 *
 * Response shape is read defensively: each row carries an "api" object with the
 * year and state and a same-named object with the measures, and the extractors
 * look those up by name at whatever depth they appear rather than assuming a
 * fixed path.
 */
const FBI_ERRORS = {
    API_KEY_MISSING: "No API key was sent. Sign up for a free key at https://api.data.gov/signup/ and set FBI_API_KEY.",
    API_KEY_INVALID: "The API key was rejected. Keys from api.data.gov are per-email and free; a key that worked yesterday can be regenerated, and a mistyped or truncated key gives exactly this error.",
    API_KEY_EXHAUSTED: "The key's daily quota is spent. api.data.gov keys allow 1000 requests per day per key across all datasets, and the limit resets on a 24 hour cycle.",
    API_KEY_RATE_LIMIT_EXCEEDED: "Too many requests in a short window. api.data.gov allows 50 requests per hour per key by default.",
};
async function cde(path) {
    let res;
    try {
        res = await fetch(`https://api.usa.gov/crime/fbi/cde${path}?API_KEY=${encodeURIComponent(key())}`, {
            headers: { ...UA, Accept: "application/json" },
            signal: AbortSignal.timeout(30000),
        });
    }
    catch (e) {
        throw new FbiError(`Network error: ${e.message}`);
    }
    const body = await res.text();
    let parsed;
    try {
        parsed = JSON.parse(body);
    }
    catch {
        throw new FbiError(`FBI returned HTTP ${res.status} with a non-JSON body: ${body.slice(0, 200)}`);
    }
    if (parsed?.error) {
        const code = String(parsed.error.code ?? "UNKNOWN");
        const message = String(parsed.error.message ?? "");
        const known = FBI_ERRORS[code];
        throw new FbiError(`FBI error ${code}: ${message}${known ? ` — ${known}` : ""}`);
    }
    if (!res.ok)
        throw new FbiError(`HTTP ${res.status}: ${body.slice(0, 250)}`);
    return parsed;
}
/** Pulls the rows array out of a CDE response regardless of which dataset key it sits under. */
function rowsOf(data) {
    if (Array.isArray(data))
        return data;
    if (data && typeof data === "object") {
        for (const v of Object.values(data)) {
            if (Array.isArray(v))
                return v;
        }
    }
    return [];
}
/** The "api" object on a row carries the year and state; the measures sit beside it. */
function meta(row) {
    const api = (row.api ?? row.API ?? {});
    const year = Number(api.year);
    return {
        year: Number.isFinite(year) ? year : undefined,
        state: api.state !== undefined ? String(api.state) : undefined,
        abbr: api.state_abbr !== undefined ? String(api.state_abbr) : undefined,
    };
}
/** The measures object, found by the dataset's own name at any depth. */
function measures(row, dataset) {
    const direct = row[dataset];
    if (direct && typeof direct === "object")
        return direct;
    // Fall back to the first object-valued child that is not the api block.
    for (const [k, v] of Object.entries(row)) {
        if (k === "api" || k === "API")
            continue;
        if (v && typeof v === "object" && !Array.isArray(v))
            return v;
    }
    return {};
}
const num = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
};
const int = (n) => Math.round(n).toLocaleString("en-US");
/**
 * Every state at once. The three existing tools each fetch one state, so no
 * comparison between states is possible with them, and a per-state number in
 * isolation says nothing about whether it is high.
 */
export async function stateComparison(args) {
    const dataset = String(args.dataset ?? "arrest").trim().toLowerCase();
    if (!["arrest", "offense", "victim"].includes(dataset)) {
        throw new FbiError(`"${dataset}" is not a CDE dataset. Use arrest, offense or victim.`);
    }
    const limit = Math.min(Math.max(Math.floor(args.limit ?? 20) || 20, 1), 60);
    const data = await cde(`/${dataset}/states/all`);
    const rows = rowsOf(data);
    if (!rows.length) {
        return [
            `The FBI returned no rows for ${dataset}/states/all.`,
            "",
            "The all-states aggregate is a single large response, and the CDE occasionally returns an empty body for it when the request is refused at the gateway. The per-state routes are separate and still work, so a per-state query is the way to confirm this is an empty-aggregate problem rather than a data problem.",
        ].join("\n");
    }
    // The all-states response carries one row per state, and each row is one
    // aggregate. Some rows are the "All" roll-up for a state across years, so the
    // year has to be read and a per-state latest kept.
    const wanted = String(args.states ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
    const measure = String(args.measure ?? "").trim();
    const byState = new Map();
    for (const row of rows) {
        const m = meta(row);
        const key = (m.abbr ?? m.state ?? "").toLowerCase();
        if (!key)
            continue;
        if (!byState.has(key))
            byState.set(key, { abbr: m.abbr ?? m.state ?? key, rows: [] });
        byState.get(key).rows.push({ year: m.year, m: measures(row, dataset) });
    }
    if (!byState.size) {
        return `The ${dataset} all-states response returned ${rows.length} row(s) but none carried a state or state_abbr field, so the response shape has changed and nothing can be ranked. The raw response should be inspected before trusting any figure derived from it.`;
    }
    // Score each state on the requested measure, or on the dataset's headline count.
    const scored = [];
    for (const [key, entry] of byState) {
        let best = null;
        for (const r of entry.rows) {
            let v = null;
            let name = "";
            if (measure) {
                v = num(r.m[measure]);
                name = measure;
            }
            else {
                // Headline first, then the largest numeric field present, so the tool is
                // still useful when the expected headline is absent.
                for (const cand of [`${dataset}_count`, "offense_count", "arrest_count", "victim_count", "total"]) {
                    const cv = num(r.m[cand]);
                    if (cv !== null) {
                        v = cv;
                        name = cand;
                        break;
                    }
                }
            }
            if (v === null)
                continue;
            if (!best || (r.year ?? 0) > (best.year ?? 0))
                best = { year: r.year, m: r.m, value: v, name };
        }
        scored.push({ key, label: entry.abbr, value: best?.value ?? null, measureName: best?.name ?? measure, year: best?.year });
    }
    const usable = scored.filter((s) => s.value !== null);
    if (!usable.length) {
        return [
            `None of the ${scored.length} states returned a usable count.`,
            "",
            measure
                ? `The measure "${measure}" is not present on any row, so the field name is wrong. Known count fields on this dataset are ${dataset}_count, offense_count, arrest_count and victim_count.`
                : "None of the four expected count fields was present on any row, so the response shape has changed and no ranking can be produced from it.",
        ].join("\n");
    }
    usable.sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
    const total = usable.reduce((a, s) => a + (s.value ?? 0), 0);
    const years = [...new Set(usable.map((s) => s.year).filter((y) => y !== undefined))].sort();
    const lines = [
        `FBI ${dataset} data across ${usable.length} states`,
        `Measure: ${usable[0].measureName}${years.length ? `  |  years present in the response: ${years.join(", ")}` : ""}`,
        "",
        `${"rank".padEnd(6)}${"state".padEnd(8)}${usable[0].measureName.slice(0, 14).padEnd(15)}${"share of total".padEnd(16)}bar`,
    ];
    usable.slice(0, limit).forEach((s, i) => {
        const v = s.value ?? 0;
        const share = total > 0 ? (v / total) * 100 : 0;
        const bar = "#".repeat(Math.max(1, Math.round(share / 2)));
        lines.push(`${String(i + 1).padEnd(6)}${s.label.padEnd(8)}${int(v).padEnd(15)}${`${share.toFixed(1)}%`.padEnd(16)}${bar}`);
    });
    if (usable.length > limit)
        lines.push(`  ...and ${usable.length - limit} more states; raise limit to see them.`);
    lines.push("", `These are raw counts, not rates. A large state will outrank a small one almost regardless of what is happening, and this dataset carries no population denominator, so nothing here says which state is the most dangerous per person. Comparing raw totals across states is close to meaningless for that question and useful only for size-of-total and rank questions.`);
    if (years.length > 1) {
        lines.push(`The response covers ${years.length} different years, and this tool keeps each state's most recent row. Cross-year comparison is available per state through crime_trend.`);
    }
    if (wanted.length) {
        const picked = usable.filter((s) => wanted.includes(s.key) || wanted.includes(s.label.toLowerCase()));
        if (picked.length) {
            lines.push("", `Requested states: ${picked.map((p) => `${p.label} ${int(p.value ?? 0)}`).join("; ")}`);
        }
        else {
            lines.push("", `None of the requested states (${wanted.join(", ")}) appeared in the response. Valid keys are the two-letter abbreviation or the full name, for example CA or California.`);
        }
    }
    return lines.join("\n");
}
/**
 * One state across years. The existing tools return a single aggregate, so a
 * trend, a turning point or a single bad year cannot be seen at all.
 */
export async function crimeTrend(args) {
    const state = String(args.state ?? "").trim();
    if (!state)
        throw new FbiError("Provide a state, as a two-letter abbreviation such as CA or as a full name such as California.");
    const dataset = String(args.dataset ?? "arrest").trim().toLowerCase();
    if (!["arrest", "offense", "victim"].includes(dataset)) {
        throw new FbiError(`"${dataset}" is not a CDE dataset. Use arrest, offense or victim.`);
    }
    const thisYear = 2026;
    const endYear = Math.min(Math.floor(args.end_year ?? thisYear) || thisYear, thisYear);
    const startYear = Math.max(Math.floor(args.start_year ?? endYear - 9) || endYear - 9, 1980);
    const points = [];
    const failures = [];
    for (let y = startYear; y <= endYear; y += 1) {
        let data;
        try {
            data = await cde(`/${dataset}/state/${encodeURIComponent(state)}/${y}/all`);
        }
        catch (e) {
            failures.push(`${y}: ${e instanceof Error ? e.message.split(" — ")[0] : String(e)}`);
            continue;
        }
        const rows = rowsOf(data);
        if (!rows.length) {
            points.push({ year: y, value: null, name: args.measure ?? "" });
            continue;
        }
        // The per-year route can return several rows, one per offense or victim
        // category. The roll-up row carries "All", so it is preferred.
        let best = null;
        for (const row of rows) {
            const m = measures(row, dataset);
            if (args.measure) {
                const v = num(m[args.measure]);
                if (v !== null && (!best || String(m.offense_name ?? m.victim_type ?? m.arrest_type ?? "") === "All"))
                    best = { v, name: args.measure };
            }
            else {
                for (const cand of [`${dataset}_count`, "offense_count", "arrest_count", "victim_count", "total"]) {
                    const v = num(m[cand]);
                    if (v === null)
                        continue;
                    const isRollup = String(m.offense_name ?? m.victim_type ?? m.arrest_type ?? "") === "All";
                    if (!best || isRollup)
                        best = { v, name: cand };
                }
            }
        }
        points.push({ year: y, value: best?.v ?? null, name: best?.name ?? String(args.measure ?? "") });
    }
    const withData = points.filter((p) => p.value !== null);
    if (!withData.length) {
        return [
            `No ${dataset} figure for ${state} between ${startYear} and ${endYear}.`,
            failures.length ? "" : "",
            failures.length
                ? `${failures.length} of the ${endYear - startYear + 1} year requests failed: ${failures.slice(0, 3).join("; ")}${failures.length > 3 ? ", and more" : ""}.`
                : "Every year request succeeded but none returned a recognisable count field, so the response shape has changed.",
            "",
            "Check the state spelling first: the route uses the full name with a lowercase-friendly form, so 'California' and 'CA' both work but 'Calif' does not.",
        ].filter(Boolean).join("\n");
    }
    const measureName = withData[0].name || args.measure || `${dataset}_count`;
    const values = withData.map((p) => p.value);
    const lo = Math.min(...values);
    const hi = Math.max(...values);
    const first = withData[0];
    const last = withData[withData.length - 1];
    const delta = last.value - first.value;
    const pct = first.value !== 0 ? (delta / first.value) * 100 : NaN;
    // Sparkline scale is over the observed range, so a flat series reads flat
    // rather than filling the width.
    const glyph = "▁▂▃▄▅▆▇█";
    // The scale returns 0..8 inclusive, so it has to be clamped to the last glyph
    // index or the highest value renders as the literal string "undefined".
    const scale = hi > lo
        ? (v) => Math.max(0, Math.min(glyph.length - 1, Math.round(((v - lo) / (hi - lo)) * (glyph.length - 1))))
        : () => Math.floor(glyph.length / 2);
    const lines = [
        `${dataset} trend for ${state}, ${withData.length} year(s) from ${first.year} to ${last.year}`,
        `Measure: ${measureName}  |  low ${int(lo)}, high ${int(hi)}`,
        "",
        `${"year".padEnd(7)}${measureName.slice(0, 14).padEnd(15)}${"change".padEnd(10)}trend   (a /Ny suffix means the change spans N years, not one)`,
    ];
    withData.forEach((p, i) => {
        const prev = i > 0 ? withData[i - 1].value : null;
        // A row that jumps a missing year is not a year-on-year change, so it is
        // labelled as spanning the gap rather than being shown as if it were annual.
        const gap = i > 0 ? p.year - withData[i - 1].year : 1;
        const chg = prev !== null && prev !== 0 ? (p.value - prev) / prev * 100 : NaN;
        const label = !Number.isFinite(chg) ? "-" : `${chg >= 0 ? "+" : ""}${chg.toFixed(1)}%${gap > 1 ? `/${gap}y` : ""}`;
        lines.push(`${String(p.year).padEnd(7)}${int(p.value).padEnd(15)}${label.padEnd(10)}${glyph[scale(p.value)]}`);
    });
    if (points.length > withData.length) {
        lines.push("", `${points.length - withData.length} year(s) in the range returned no figure and are omitted: ${points.filter((p) => p.value === null).map((p) => p.year).join(", ")}`);
    }
    lines.push("", `${Math.abs(delta) === 0 ? "No net change" : `${delta > 0 ? "Up" : "Down"} ${int(Math.abs(delta))} (${Number.isFinite(pct) ? `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%` : "percentage undefined, the starting year was zero"})`} between ${first.year} and ${last.year}.`);
    const years = withData.map((p) => p.year);
    const gaps = years.slice(1).map((y, i) => y - years[i]).filter((d) => d > 1);
    if (gaps.length) {
        lines.push(`The series is not continuous: ${gaps.length} gap(s) larger than one year, so a year-on-year change across a gap is not a one-year change.`);
    }
    lines.push("", "These are raw counts, not rates, and the CDE publishes no population denominator, so a rise over time can reflect population growth rather than more crime. A falling raw count with a growing population is a substantial fall per person; a rising raw count is ambiguous. Read this as direction of total volume, never as a crime rate.");
    return lines.join("\n");
}
/**
 * The three existing tools return one raw JSON dump each. This joins arrests,
 * offenses and victims for one state into a single readable report, which is the
 * only way the three views can be read against each other.
 */
export async function crimeSnapshot(args) {
    const state = String(args.state ?? "").trim();
    if (!state)
        throw new FbiError("Provide a state, for example CA or California.");
    const top = Math.min(Math.max(Math.floor(args.top ?? 8) || 8, 1), 30);
    const load = async (dataset) => {
        try {
            return { rows: rowsOf(await cde(`/${dataset}/state/${encodeURIComponent(state)}/all`)), error: "" };
        }
        catch (e) {
            return { rows: [], error: e instanceof Error ? e.message : String(e) };
        }
    };
    const [a, o, v] = await Promise.all([load("arrest"), load("offense"), load("victim")]);
    const parts = [
        { name: "arrests", data: a },
        { name: "offenses", data: o },
        { name: "victims", data: v },
    ];
    const ok = parts.filter((p) => p.data.rows.length);
    if (!ok.length) {
        return [
            `Could not read any of the three datasets for ${state}.`,
            "",
            ...parts.map((p) => `  ${p.name}: ${p.data.error || "returned no rows"}`),
            "",
            "All three routes use the same state segment, so three identical failures usually means the state spelling is wrong rather than three separate problems. The route accepts a full name such as California or a two-letter abbreviation such as CA.",
        ].join("\n");
    }
    const lines = [`FBI crime snapshot for ${state}`, ""];
    for (const part of parts) {
        if (!part.data.rows.length) {
            lines.push(`${part.name}: unavailable, ${part.data.error}`);
            lines.push("");
            continue;
        }
        const rows = part.data.rows;
        const years = [...new Set(rows.map((r) => meta(r).year).filter((y) => y !== undefined))].sort();
        const label = part.name === "arrests" ? "arrest" : part.name === "offenses" ? "offense" : "victim";
        lines.push(`${part.name} (${rows.length} row(s)${years.length ? `, years ${years[0]}-${years[years.length - 1]}` : ""})`);
        // Each dataset has its own dimension names. Using the arrest ones for the
        // offense dataset produced a breakdown headed "arrest_type" over offense
        // rows, which is a mislabel rather than a formatting slip.
        const DIMS = {
            arrest: { dim: "arrest_type", dim2: "offense_name", count: "arrest_count" },
            offense: { dim: "offense_type", dim2: "offense_name", count: "offense_count" },
            victim: { dim: "victim_type", dim2: "victim_offense", count: "victim_count" },
        };
        const dimsSpec = DIMS[label];
        const dimKey = dimsSpec.dim;
        const dim2Key = dimsSpec.dim2;
        const countKey = dimsSpec.count;
        const isRollup = (v) => /^all$|^total$/i.test(String(v ?? "").trim());
        // The CDE returns the "All" roll-up row alongside the rows it is the sum of.
        // Adding those together double-counts every event, so the roll-up is taken
        // out of the ranking and used as the percentage denominator instead.
        const detail = rows.filter((row) => !isRollup(measures(row, label)[dimKey]));
        const rollupRow = rows.find((row) => isRollup(measures(row, label)[dimKey]));
        const rollup = rollupRow ? num(measures(rollupRow, label)[countKey]) : null;
        const ranked = detail.length ? detail : rows;
        const byDim = new Map();
        const byOffense = new Map();
        for (const row of ranked) {
            const m = measures(row, label);
            const c = num(m[countKey]);
            if (c === null)
                continue;
            const dim = String(m[dimKey] ?? "All");
            const off = String(m[dim2Key] ?? "All");
            byDim.set(dim, (byDim.get(dim) ?? 0) + c);
            if (off !== "All" || !byOffense.size)
                byOffense.set(off, (byOffense.get(off) ?? 0) + c);
        }
        const dims = [...byDim.entries()].sort((x, y) => y[1] - x[1]);
        if (dims.length === 1 && isRollup(dims[0][0])) {
            // A dataset that returned only its roll-up has nothing to break down, and
            // a one-row table reading "All 100%" looks like a result rather than an
            // absence of one.
            lines.push("", `  single aggregate, no breakdown published: ${int(dims[0][1])}`);
        }
        else if (dims.length) {
            const dimTotal = rollup ?? dims.reduce((a2, [, n]) => a2 + n, 0);
            lines.push("", `  by ${dimKey}:`, ...dims.slice(0, top).map(([k, n]) => `    ${k.slice(0, 30).padEnd(32)}${int(n).padEnd(14)}${dimTotal > 0 ? `${((n / dimTotal) * 100).toFixed(1)}%` : ""}`));
            if (dims.length > top)
                lines.push(`    ...and ${dims.length - top} more; raise top to see them.`);
            if (rollup !== null)
                lines.push(`    percentages are of the All roll-up, ${int(rollup)}, which is not the sum of the rows listed`);
        }
        const offs = [...byOffense.entries()].sort((x, y) => y[1] - x[1]);
        if (offs.length === 1 && isRollup(offs[0][0])) {
            // Same as above for the secondary dimension.
        }
        else if (offs.length) {
            const offTotal = rollup ?? offs.reduce((a2, [, n]) => a2 + n, 0);
            lines.push("", `  by ${dim2Key}:`, ...offs.slice(0, top).map(([k, n]) => `    ${k.slice(0, 40).padEnd(42)}${int(n).padEnd(14)}${offTotal > 0 ? `${((n / offTotal) * 100).toFixed(1)}%` : ""}`));
            if (offs.length > top)
                lines.push(`    ...and ${offs.length - top} more; raise top to see them.`);
        }
        if (!dims.length && !offs.length) {
            lines.push("", `  No breakdown dimension was present, so this is a single aggregate. The raw row is: ${JSON.stringify(measures(rows[0], label)).slice(0, 300)}`);
        }
        lines.push("");
    }
    lines.push("The three views count different things and are not three measures of one number. An offense is an event reported, an arrest is a person taken into custody on suspicion, and a victim is a person harmed, often recorded more than once for one event. They will not agree, and the gap between them is usually the interesting part, so do not sum them or average them.");
    lines.push("All figures are the CDE's most recent estimates for the state, published with a lag of a year or more and revised as agencies submit data, so the newest year is provisional.");
    return lines.join("\n");
}
