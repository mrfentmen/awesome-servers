/**
 * PVGIS client, keyless.
 * European Commission solar data: PV yield, irradiation, typical weather and hourly series.
 */
export class PvgisError extends Error {
    constructor(message) {
        super(message);
        this.name = "PvgisError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = "mrfentmen-pvgis-mcp/1.0";
const BASE = "https://re.jrc.ec.europa.eu/api/v5_3";
const MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];
const MONTH_DAYS = [31, 28.25, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
async function getJson(path, timeoutMs) {
    let res;
    try {
        res = await fetch(`${BASE}${path}`, {
            headers: { "User-Agent": UA, Accept: "application/json" },
            signal: AbortSignal.timeout(timeoutMs),
        });
    }
    catch (e) {
        throw new PvgisError(`Could not reach PVGIS: ${errorMessage(e)}`);
    }
    if (res.status === 400) {
        const body = (await res.text()).slice(0, 300);
        throw new PvgisError(`PVGIS rejected the request: ${body}`);
    }
    if (!res.ok) {
        const body = (await res.text()).slice(0, 200);
        throw new PvgisError(`PVGIS returned HTTP ${res.status}: ${body}`);
    }
    const raw = (await res.text()).slice(0, 4_000_000);
    try {
        return JSON.parse(raw);
    }
    catch {
        throw new PvgisError("PVGIS returned a non-JSON response.");
    }
}
export function parseLocation(lat, lon) {
    const la = Number.parseFloat(lat);
    const lo = Number.parseFloat(lon);
    if (!Number.isFinite(la) || la < -90 || la > 90) {
        throw new PvgisError(`Latitude must be between -90 and 90, got "${lat}". PVGIS covers Europe, Africa and Asia.`);
    }
    if (!Number.isFinite(lo) || lo < -180 || lo > 180) {
        throw new PvgisError(`Longitude must be between -180 and 180, got "${lon}".`);
    }
    return { lat: la, lon: lo };
}
function number(value, fallback, min, max, label) {
    if (value === undefined || !Number.isFinite(value))
        return fallback;
    if (value < min || value > max) {
        throw new PvgisError(`${label} must be between ${min} and ${max}, got ${value}.`);
    }
    return value;
}
function pvQuery(loc, peakPower, loss, angle, aspect) {
    const q = new URLSearchParams({
        lat: String(loc.lat),
        lon: String(loc.lon),
        peakpower: String(peakPower),
        loss: String(loss),
        outputformat: "json",
    });
    if (angle === undefined) {
        q.set("optimalangles", "1");
    }
    else {
        q.set("angle", String(angle));
        q.set("aspect", String(aspect ?? 0));
    }
    return q.toString();
}
export async function pvYield(lat, lon, peakPower = 1, loss = 14, angle, aspect) {
    const loc = parseLocation(lat, lon);
    const power = number(peakPower, 1, 0.05, 100000, "Peak power (kWp)");
    const systemLoss = number(loss, 14, 0, 99, "System loss (%)");
    const tilt = angle === undefined ? undefined : number(angle, 30, 0, 90, "Panel angle (degrees)");
    const azimuth = aspect === undefined ? undefined : number(aspect, 0, -180, 180, "Panel aspect (degrees)");
    return getJson(`/PVcalc?${pvQuery(loc, power, systemLoss, tilt, azimuth)}`, 90000);
}
function monthly(rows) {
    return rows
        .map((r) => {
        const name = (MONTHS[r.month - 1] ?? `Month ${r.month}`).padEnd(10);
        const energy = typeof r.E_m === "number" ? `${r.E_m.toFixed(1)} kWh` : "n/a";
        const poa = typeof r["H(i)_m"] === "number" ? `${r["H(i)_m"].toFixed(1)} kWh/m2` : "";
        return `  ${name} ${energy.padStart(12)}   ${poa}`;
    })
        .join("\n");
}
function systemLine(data) {
    const slope = data.inputs?.mounting_system?.fixed?.slope;
    const azimuth = data.inputs?.mounting_system?.fixed?.azimuth;
    const bits = [];
    if (slope)
        bits.push(`tilt ${slope.value}deg${slope.optimal ? " (optimal)" : ""}`);
    if (azimuth)
        bits.push(`azimuth ${azimuth.value}deg${azimuth.optimal ? " (south-facing)" : ""}`);
    const module_ = data.inputs?.pv_module;
    if (module_)
        bits.push(`${module_.peak_power} kWp, ${module_.system_loss}% losses`);
    return bits.join(" · ");
}
export function formatPvYield(data, loc) {
    const rows = data.outputs?.monthly?.fixed;
    const totals = data.outputs?.totals?.fixed;
    if (!rows || rows.length === 0)
        throw new PvgisError("PVGIS returned no monthly output.");
    const best = [...rows].filter((r) => typeof r.E_m === "number").sort((a, b) => (b.E_m ?? 0) - (a.E_m ?? 0))[0];
    const worst = [...rows].filter((r) => typeof r.E_m === "number").sort((a, b) => (a.E_m ?? 0) - (b.E_m ?? 0))[0];
    const lines = [
        `PV output for ${loc.lat}, ${loc.lon}`,
        systemLine(data),
        "",
        "Month      energy        plane-of-array irradiation",
        monthly(rows),
        "",
    ];
    if (totals) {
        lines.push(`Yearly total      ${totals.E_y?.toFixed(0)} kWh`, `Daily average     ${totals.E_d?.toFixed(2)} kWh`, `Irradiation       ${totals["H(i)_y"]?.toFixed(0)} kWh/m2/year`, `System losses     ${totals.l_total?.toFixed(1) ?? "n/a"}%`);
    }
    if (best && worst) {
        lines.push("", `Best month   ${MONTHS[best.month - 1]} at ${best.E_m?.toFixed(0)} kWh`, `Worst month  ${MONTHS[worst.month - 1]} at ${worst.E_m?.toFixed(0)} kWh`);
    }
    return lines.join("\n");
}
export async function radiation(lat, lon, angle, aspect) {
    const data = await pvYield(lat, lon, 1, 14, angle, aspect);
    const rows = data.outputs?.monthly?.fixed;
    const totals = data.outputs?.totals?.fixed;
    if (!rows)
        throw new PvgisError("PVGIS returned no irradiation data.");
    const lines = rows.map((r) => {
        const name = (MONTHS[r.month - 1] ?? `Month ${r.month}`).padEnd(10);
        const poa = typeof r["H(i)_m"] === "number" ? `${r["H(i)_m"].toFixed(1)} kWh/m2` : "n/a";
        const day = typeof r["H(i)_d"] === "number" ? `${r["H(i)_d"].toFixed(2)} kWh/m2/day` : "";
        const spread = typeof r.SD_m === "number" ? `± ${r.SD_m.toFixed(1)}` : "";
        return `  ${name} ${poa.padStart(14)}  ${day.padEnd(22)} ${spread}`;
    });
    return [
        `Solar irradiation on the panel plane at ${data.inputs?.location?.latitude}, ${data.inputs?.location?.longitude}`,
        systemLine(data),
        "",
        "Month      in-plane       per day                year-to-year spread",
        ...lines,
        "",
        `Yearly total  ${totals?.["H(i)_y"]?.toFixed(0)} kWh/m2 (${totals?.["H(i)_d"]?.toFixed(2)} kWh/m2 per day)`,
        `Database      ${data.inputs?.meteo_data?.radiation_db ?? "?"} ${data.inputs?.meteo_data?.year_min ?? ""}-${data.inputs?.meteo_data?.year_max ?? ""}`,
    ].join("\n");
}
export async function hourlyOutput(lat, lon, year, peakPower = 1, loss = 14, angle) {
    const loc = parseLocation(lat, lon);
    const y = number(year, new Date().getUTCFullYear() - 1, 2005, new Date().getUTCFullYear(), "Year");
    const power = number(peakPower, 1, 0.05, 100000, "Peak power (kWp)");
    const systemLoss = number(loss, 14, 0, 99, "System loss (%)");
    const q = new URLSearchParams({
        lat: String(loc.lat),
        lon: String(loc.lon),
        startyear: String(y),
        endyear: String(y),
        peakpower: String(power),
        loss: String(systemLoss),
        outputformat: "json",
    });
    if (angle !== undefined) {
        q.set("angle", String(number(angle, 30, 0, 90, "Panel angle (degrees)")));
        q.set("aspect", "0");
    }
    const data = await getJson(`/seriescalc?${q.toString()}`, 120000);
    const rows = data.outputs?.hourly ?? [];
    if (rows.length === 0)
        throw new PvgisError("PVGIS returned no hourly rows.");
    const perMonth = new Map();
    for (const r of rows) {
        const stamp = r.time ?? r["time(UTC)"] ?? "";
        const month = Number(stamp.slice(4, 6));
        if (!month)
            continue;
        const bucket = perMonth.get(month) ?? { sum: 0, sun: 0, n: 0, temp: 0 };
        bucket.sum += r["G(i)"] ?? 0;
        bucket.sun += (r["H_sun"] ?? 0) > 0 ? 1 : 0;
        bucket.temp += r.T2m ?? 0;
        bucket.n += 1;
        perMonth.set(month, bucket);
    }
    const lines = [...perMonth.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([m, b]) => {
        const name = (MONTHS[m - 1] ?? `Month ${m}`).padEnd(10);
        const avg = b.n ? b.sum / b.n : 0;
        const temp = b.n ? b.temp / b.n : 0;
        return `  ${name} ${avg.toFixed(0).padStart(5)} W/m2 avg   ${String(b.sun).padStart(4)} sun hours   ${temp.toFixed(1)} °C avg`;
    });
    const totalSun = [...perMonth.values()].reduce((acc, b) => acc + b.sun, 0);
    return [
        `Hourly PV series for ${loc.lat}, ${loc.lon} in ${y} (${rows.length} hours)`,
        "",
        "Month      irradiance        daylight       temperature",
        ...lines,
        "",
        `Sunlight hours in the year: ${totalSun}`,
    ].join("\n");
}
export async function typicalWeather(lat, lon) {
    const loc = parseLocation(lat, lon);
    const data = await getJson(`/tmy?lat=${loc.lat}&lon=${loc.lon}&outputformat=json`, 120000);
    const rows = data.outputs?.tmy_hourly ?? [];
    if (rows.length === 0)
        throw new PvgisError("PVGIS returned no typical-year data.");
    const buckets = new Map();
    for (const r of rows) {
        const stamp = r["time(UTC)"] ?? r.time ?? "";
        const month = Number(stamp.slice(4, 6));
        if (!month)
            continue;
        const b = buckets.get(month) ?? { g: 0, temp: 0, rh: 0, wind: 0, n: 0 };
        b.g += r["G(h)"] ?? 0;
        b.temp += r.T2m ?? 0;
        b.rh += r.RH ?? 0;
        b.wind += r.WS10m ?? 0;
        b.n += 1;
        buckets.set(month, b);
    }
    const lines = [...buckets.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([m, b]) => {
        const name = (MONTHS[m - 1] ?? `Month ${m}`).padEnd(10);
        const kwh = b.n ? ((b.g / b.n) * 24 * (MONTH_DAYS[m - 1] ?? 30)) / 1000 : 0;
        return `  ${name} ${(b.temp / b.n).toFixed(1).padStart(5)} °C   ${(b.rh / b.n).toFixed(0).padStart(3)}% RH   ${(b.wind / b.n).toFixed(1).padStart(4)} m/s wind   ${kwh.toFixed(0).padStart(4)} kWh/m2`;
    });
    const years = data.outputs?.months_selected ?? [];
    return [
        `Typical meteorological year at ${loc.lat}, ${loc.lon}`,
        "",
        "Month      temperature    humidity   wind speed   global irradiation",
        ...lines,
        "",
        `Built from ${rows.length} hourly records${years.length ? `, months drawn from ${Math.min(...years.map((m) => m.year))}-${Math.max(...years.map((m) => m.year))}` : ""}.`,
    ].join("\n");
}
export async function systemSummary(lat, lon, peakPower = 4, loss = 14, angle) {
    const loc = parseLocation(lat, lon);
    const power = number(peakPower, 4, 0.05, 100000, "Peak power (kWp)");
    const data = await pvYield(lat, lon, power, loss, angle);
    const totals = data.outputs?.totals?.fixed;
    if (!totals?.E_y)
        throw new PvgisError("PVGIS returned no yearly total.");
    const perKwp = totals.E_y / power;
    const capacityFactor = totals.E_y / (power * 8760);
    const co2 = totals.E_y * 0.4;
    const homes = totals.E_y / 10700;
    const km = Math.sqrt((power * 4) / 1000);
    return [
        `System summary for ${loc.lat}, ${loc.lon}`,
        systemLine(data),
        "",
        `  yearly output      ${totals.E_y.toFixed(0)} kWh`,
        `  yield per kWp      ${perKwp.toFixed(0)} kWh/kWp`,
        `  capacity factor    ${(capacityFactor * 100).toFixed(1)}%`,
        `  CO2 avoided        ${co2.toFixed(0)} kg/year (at 0.4 kg/kWh)`,
        `  equivalent homes   ${homes.toFixed(1)} (at 10 700 kWh/year)`,
        `  rough roof area    ${(power * 5).toFixed(0)} m2 for the panels`,
        `  land footprint     about ${km.toFixed(1)} x ${km.toFixed(1)} m at this density`,
        "",
        "Estimates only - shading, soiling and inverter clipping are not modelled.",
    ].join("\n");
}
export async function compareLocations(sites, peakPower = 1, loss = 14) {
    const list = sites
        .split(";")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 5);
    if (list.length === 0)
        throw new PvgisError("Give at least one site as 'lat,lon'.");
    const power = number(peakPower, 1, 0.05, 100000, "Peak power (kWp)");
    const results = await Promise.all(list.map(async (entry) => {
        const [lat, lon] = entry.split(",");
        if (!lat || !lon)
            throw new PvgisError(`"${entry}" is not in 'lat,lon' form.`);
        const loc = parseLocation(lat, lon);
        const data = await pvYield(lat, lon, power, loss);
        const yearly = data.outputs?.totals?.fixed?.E_y;
        const irradiation = data.outputs?.totals?.fixed?.["H(i)_y"];
        return { loc, yearly: yearly ?? 0, irradiation: irradiation ?? 0 };
    }));
    const best = [...results].sort((a, b) => b.yearly - a.yearly)[0];
    const lines = results.map((r) => {
        const mark = r === best ? " <-- best" : "";
        return `  ${`${r.loc.lat}, ${r.loc.lon}`.padEnd(22)} ${r.yearly.toFixed(0).padStart(6)} kWh/year   ${r.irradiation.toFixed(0).padStart(5)} kWh/m2${mark}`;
    });
    return [
        `PV yield for ${results.length} sites at ${power} kWp:`,
        "",
        ...lines,
        "",
        `Best site: ${best.loc.lat}, ${best.loc.lon} with ${best.yearly.toFixed(0)} kWh/year.`,
    ].join("\n");
}
export async function sizeSystem(lat, lon, annualKwh, loss = 14, angle) {
    const loc = parseLocation(lat, lon);
    const target = number(annualKwh, 0, 100, 10_000_000, "Target annual output (kWh)");
    const baseline = await pvYield(lat, lon, 1, loss, angle);
    const perKwp = baseline.outputs?.totals?.fixed?.E_y;
    if (!perKwp)
        throw new PvgisError("PVGIS returned no yearly yield to size against.");
    const size = target / perKwp;
    const panels = Math.ceil((size * 1000) / 400);
    const area = size * 5;
    const check = await pvYield(lat, lon, Math.max(0.05, Number(size.toFixed(2))), loss, angle);
    const modelled = check.outputs?.totals?.fixed?.E_y ?? 0;
    return [
        `Sizing a PV system for ${target.toFixed(0)} kWh/year at ${loc.lat}, ${loc.lon}`,
        "",
        `  yield per kWp      ${perKwp.toFixed(0)} kWh/kWp/year here`,
        `  system size        ${size.toFixed(2)} kWp`,
        `  400 W panels       about ${panels} panels`,
        `  roof area          about ${area.toFixed(1)} m2`,
        `  modelled output    ${modelled.toFixed(0)} kWh/year`,
        "",
        "Re-run with your real target if the number differs from your last electricity bill.",
    ].join("\n");
}
const round = (value, digits = 0) => value.toFixed(digits);
/**
 * What the terrain does to the sun at this exact spot. PVGIS applies this
 * horizon to every radiation calculation behind the scenes, so a system that
 * looks fine on paper can be blocked by a hill.
 */
export async function horizonProfile(lat, lon) {
    const loc = parseLocation(lat, lon);
    const data = await getJson(`/printhorizon?lat=${loc.lat}&lon=${loc.lon}&outputformat=json`, 60000);
    const profile = data.outputs?.horizon_profile ?? [];
    if (!profile.length)
        throw new PvgisError("PVGIS returned no horizon profile for this location.");
    const sorted = [...profile].sort((a, b) => b.H_hor - a.H_hor);
    const max = sorted[0];
    const south = profile.filter((p) => p.A >= -60 && p.A <= 60);
    const southAvg = south.length ? south.reduce((sum, p) => sum + p.H_hor, 0) / south.length : 0;
    const blockedAbove10 = profile.filter((p) => p.H_hor > 10).length;
    const flat = profile.filter((p) => p.H_hor <= 0.5).length;
    return [
        `Horizon profile at ${loc.lat}, ${loc.lon} (elevation ${round(data.inputs?.location?.elevation ?? 0)} m)`,
        `  ${profile.length} point(s) at 7.5 degree steps`,
        `  steepest obstacle: ${round(max.H_hor, 1)} degrees at azimuth ${round(max.A, 1)} (0 is due south, negative east)`,
        `  mean obstacle across the southern arc (-60 to 60): ${round(southAvg, 1)} degrees`,
        `  points above 10 degrees: ${blockedAbove10} | points at or below 0.5 degrees: ${flat} (open horizon)`,
        "",
        blockedAbove10 > profile.length / 4
            ? "Most of the horizon is blocked: the yearly yield here is limited by terrain, and raising the mounting angle will not recover it."
            : southAvg > 10
                ? "The southern arc is obstructed, so expect winter mornings and evenings to lose production."
                : "The horizon is open enough that terrain is not the limiting factor at this location.",
    ].join("\n");
}
/**
 * Sizes an off-grid system against a real daily load: PVGIS simulates the
 * battery day by day and reports how often it runs flat, which is the number
 * that decides whether the array or the battery is too small.
 */
export async function offgridSizing(args) {
    const loc = parseLocation(args.lat, args.lon);
    const peak = number(args.peakPower, 1000, 1, 1000000, "PV array peak power (Wp)");
    const battery = number(args.batteryWh, 5000, 1, 10000000, "Battery capacity (Wh)");
    const daily = number(args.dailyWh, 3000, 1, 1000000, "Daily consumption (Wh)");
    const cutoff = number(args.cutoff, 40, 0, 100, "Battery cutoff (%)");
    const q = new URLSearchParams({
        lat: String(loc.lat),
        lon: String(loc.lon),
        peakpower: String(peak),
        batterysize: String(battery),
        consumptionday: String(daily),
        cutoff: String(cutoff),
        outputformat: "json",
    });
    const data = await getJson(`/SHScalc?${q.toString()}`, 90000);
    const totals = data.outputs?.totals;
    const monthlyRows = data.outputs?.monthly ?? [];
    if (!totals || !monthlyRows.length)
        throw new PvgisError("PVGIS returned no off-grid simulation for this system.");
    const days = totals.d_total ?? 0;
    const shortDays = totals.f_e ?? 0;
    return [
        `Off-grid sizing at ${loc.lat}, ${loc.lon}`,
        `  array ${round(peak)} Wp | battery ${round(battery)} Wh | load ${round(daily)} Wh/day | cutoff ${round(cutoff)}%`,
        `  simulated over ${round(days)} day(s)`,
        "",
        `  days the battery ended full: ${round(totals.f_f ?? 0, 1)}%`,
        `  days the load was not fully met: ${round(shortDays, 1)}%`,
        `  energy not available: ${round(totals.E_miss ?? 0)} Wh/day average`,
        `  energy thrown away: ${round(totals.E_lost ?? 0)} Wh/day average`,
        "",
        "Monthly, produced against consumed:",
        `  ${monthlyRows
            .map((row) => `${(MONTHS[row.month - 1] ?? `M${row.month}`).slice(0, 3)} ${round(row.E_d ?? 0)}Wh/d${row.f_e && row.f_e > 5 ? ` (short ${round(row.f_e, 1)}% of days)` : ""}`)
            .join(" | ")}`,
        "",
        shortDays > 5
            ? `Undersized: on ${round(shortDays, 1)}% of days the load is not met. Add array (currently ${round(peak)} Wp) or battery (${round(battery)} Wh), or cut the load below ${round(daily * 0.8)} Wh/day.`
            : `Covered: only ${round(shortDays, 1)}% of days fall short, which is normal for a system sized just above the load.`,
    ].join("\n");
}
/**
 * The tilt and direction PVGIS says are best here, set against the 30-degree
 * rule of thumb, so a mounting decision has a number behind it.
 */
export async function optimalTilt(args) {
    const loc = parseLocation(args.lat, args.lon);
    const loss = number(args.loss, 14, 0, 99, "System loss (%)");
    const base = `lat=${loc.lat}&lon=${loc.lon}&peakpower=1&loss=${loss}&outputformat=json`;
    const [optimal, flat] = await Promise.all([
        getJson(`/PVcalc?${base}&optimalangles=1`, 90000),
        getJson(`/PVcalc?${base}&angle=30&aspect=0`, 90000),
    ]);
    const best = optimal.inputs?.mounting_system?.fixed;
    const bestYield = optimal.outputs?.totals?.fixed?.E_y ?? 0;
    const flatYield = flat.outputs?.totals?.fixed?.E_y ?? 0;
    if (!bestYield || !flatYield)
        throw new PvgisError("PVGIS returned no yield for one of the two mountings.");
    const gain = bestYield - flatYield;
    const bestAngle = best?.slope?.value ?? 0;
    const bestAzimuth = best?.azimuth?.value ?? 0;
    return [
        `Optimal mounting at ${loc.lat}, ${loc.lon} (loss ${round(loss)}%)`,
        `  PVGIS optimum: tilt ${round(bestAngle)} degrees, azimuth ${round(bestAzimuth)} (0 is due south)`,
        `  yield at the optimum: ${round(bestYield)} kWh/kWp/year  (${round(optimal.outputs?.totals?.fixed?.["H(i)_y"] ?? 0)} kWh/m2 in plane)`,
        `  yield at a fixed 30 degree south mount: ${round(flatYield)} kWh/kWp/year`,
        "",
        gain > 0
            ? `Tilting to ${round(bestAngle)} degrees is worth ${round(gain)} kWh/kWp/year, about ${round((gain / flatYield) * 100, 1)}% more than 30 degrees.`
            : `The 30 degree mount matches or beats the optimum here by ${round(Math.abs(gain))} kWh/kWp/year, so the simple mount is fine.`,
        `For a 4 kWp array the same difference is about ${round(gain * 4)} kWh a year.`,
    ].join("\n");
}
const mean = (values) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0);
function stdDev(values) {
    if (values.length < 2)
        return 0;
    const m = mean(values);
    return Math.sqrt(values.reduce((sum, v) => sum + (v - m) ** 2, 0) / (values.length - 1));
}
/** Nearest-rank percentile, which is what a P90 yield guarantee is built on. */
function percentile(values, p) {
    if (!values.length)
        return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
    return sorted[index];
}
/**
 * How much the solar resource actually varied year to year, month by month,
 * across the whole PVGIS reference period. A monthly average hides the bad year
 * that decides whether a P90 guarantee is met.
 */
export async function solarVariability(args) {
    const loc = parseLocation(args.lat, args.lon);
    const data = await getJson(`/MRcalc?lat=${loc.lat}&lon=${loc.lon}&horirrad=1&outputformat=json`, 90000);
    const rows = data.outputs?.monthly ?? [];
    if (rows.length < 24)
        throw new PvgisError("PVGIS MRcalc returned too few monthly rows to measure variability.");
    const byMonth = new Map();
    for (const row of rows) {
        const value = row["H(h)_m"];
        if (typeof value !== "number" || typeof row.month !== "number" || typeof row.year !== "number")
            continue;
        byMonth.set(row.month, [...(byMonth.get(row.month) ?? []), { year: row.year, value }]);
    }
    if (!byMonth.size)
        throw new PvgisError("PVGIS MRcalc returned no numeric monthly irradiation values.");
    const stats = [];
    for (const [month, entries] of byMonth) {
        const values = entries.map((e) => e.value);
        const worst = entries.reduce((a, b) => (a.value <= b.value ? a : b));
        const best = entries.reduce((a, b) => (a.value >= b.value ? a : b));
        stats.push({
            month,
            n: entries.length,
            mean: mean(values),
            min: Math.min(...values),
            max: Math.max(...values),
            sd: stdDev(values),
            worst: worst.year,
            best: best.year,
        });
    }
    stats.sort((a, b) => a.month - b.month);
    const db = data.inputs?.meteo_data?.radiation_db ?? "not reported";
    const from = data.inputs?.meteo_data?.year_min;
    const to = data.inputs?.meteo_data?.year_max;
    const annual = stats.map((s) => s.mean);
    const annualTotal = annual.reduce((a, b) => a + b, 0);
    const annualSd = stats.reduce((sum, s) => sum + s.sd, 0);
    return [
        `Solar resource variability at ${loc.lat}, ${loc.lon}`,
        `  horizontal irradiation, dataset ${db}${from && to ? `, reference years ${from}-${to}` : ""}`,
        `  ${rows.length} month-year record(s) behind these figures`,
        "",
        "Month       mean     min      max       sd    cv     worst yr  best yr",
        ...stats.map((s) => {
            const name = (MONTHS[s.month - 1] ?? `Month ${s.month}`).padEnd(10);
            const cv = s.mean > 0 ? (s.sd / s.mean) * 100 : 0;
            return `  ${name} ${s.mean.toFixed(1).padStart(7)} ${s.min.toFixed(1).padStart(7)} ${s.max.toFixed(1).padStart(8)} ${s.sd.toFixed(1).padStart(7)} ${cv.toFixed(1).padStart(5)}% ${String(s.worst).padStart(9)} ${String(s.best).padStart(8)}`;
        }),
        "",
        `  mean annual total ${annualTotal.toFixed(0)} kWh/m2, with a summed monthly sd of ${annualSd.toFixed(0)} kWh/m2`,
        `  so the coefficient of variation across the reference period is ${annualTotal > 0 ? ((annualSd / annualTotal) * 100).toFixed(1) : "n/a"}%`,
        "",
        "Reading this: the sd column is how much the same month swings between the best and worst year in the record, and the cv column says that swing as a percentage of the mean. A month with cv above 20% cannot be banked on a single average.",
        "Source: PVGIS MRcalc, the JRC reference dataset. Interannual variation, not an interannual-adjusted yield.",
    ].join("\n");
}
/**
 * The shape of a day: average global irradiance by hour, split into a summer
 * and a winter half-year, plus the direct and diffuse split that decides how
 * much of the morning a tracker can actually follow.
 */
export async function diurnalProfile(args) {
    const loc = parseLocation(args.lat, args.lon);
    const data = await getJson(`/tmy?lat=${loc.lat}&lon=${loc.lon}&outputformat=json`, 120000);
    const rows = data.outputs?.tmy_hourly ?? [];
    if (!rows.length)
        throw new PvgisError("PVGIS returned no typical-year hourly data for this site.");
    const byHour = new Map();
    let nights = 0;
    for (const row of rows) {
        // Kept as two statements: `String(row["time(UTC)" ?? "")` in one expression
        // trips a TypeScript parser bug on the quoted key with parentheses.
        const rawStamp = row["time(UTC)"];
        const stamp = String(rawStamp ?? "");
        // PVGIS stamps as YYYYMMDD:HHMM, so the hour is characters 9 and 10.
        const hour = Number(stamp.slice(9, 11));
        const month = Number(stamp.slice(4, 6));
        if (!Number.isFinite(hour) || !Number.isFinite(month))
            continue;
        const g = row["G(h)"] ?? 0;
        if (g <= 0)
            nights += 1;
        const bucket = byHour.get(hour) ?? { g: 0, b: 0, d: 0, n: 0, summer: 0, winter: 0 };
        bucket.g += g;
        bucket.b += row["Gb(n)"] ?? 0;
        bucket.d += row["Gd(h)"] ?? 0;
        bucket.n += 1;
        if (month >= 5 && month <= 8)
            bucket.summer += 1;
        if (month === 12 || month <= 2)
            bucket.winter += 1;
        byHour.set(hour, bucket);
    }
    if (byHour.size === 0)
        throw new PvgisError("No hourly timestamps could be read out of the PVGIS typical-year series.");
    const hours = [...byHour.keys()].sort((a, b) => a - b);
    const peak = hours.reduce((best, h) => {
        const b = byHour.get(h);
        const bestB = byHour.get(best);
        return b.g / Math.max(b.n, 1) > bestB.g / Math.max(bestB.n, 1) ? h : best;
    }, hours[0]);
    const daylight = hours.filter((h) => byHour.get(h).g / Math.max(byHour.get(h).n, 1) > 0.5);
    const dailyKwh = hours.reduce((sum, h) => sum + byHour.get(h).g / Math.max(byHour.get(h).n, 1), 0) / 1000;
    const totalG = hours.reduce((sum, h) => sum + byHour.get(h).g, 0);
    const totalB = hours.reduce((sum, h) => sum + byHour.get(h).b, 0);
    const totalD = hours.reduce((sum, h) => sum + byHour.get(h).d, 0);
    const diffuseShare = totalG > 0 ? (totalD / totalG) * 100 : 0;
    const bar = (value, peakValue, width = 24) => {
        const filled = peakValue > 0 ? Math.round((value / peakValue) * width) : 0;
        return `${"#".repeat(filled)}${".".repeat(Math.max(0, width - filled))}`;
    };
    const peakValue = byHour.get(peak).g / Math.max(byHour.get(peak).n, 1);
    return [
        `Diurnal solar profile at ${loc.lat}, ${loc.lon}`,
        `  ${rows.length} hourly record(s) from the PVGIS typical meteorological year`,
        `  average day carries ${dailyKwh.toFixed(2)} kWh/m2 of global horizontal irradiation`,
        `  peak average hour ${String(peak).padStart(2, "0")}:00 UTC at ${peakValue.toFixed(0)} W/m2`,
        daylight.length ? `  sun above 0.5 W/m2 average across hours ${daylight[0]}:00 to ${daylight[daylight.length - 1]}:00` : "  no hour averages above 0.5 W/m2",
        "",
        "Hour  summer  winter  all-year  direct  diffuse",
        ...hours.map((h) => {
            const b = byHour.get(h);
            const all = b.g / Math.max(b.n, 1);
            const summer = b.summer ? b.g / b.summer : 0;
            const winter = b.winter ? b.g / b.winter : 0;
            return `  ${String(h).padStart(2, "0")}   ${summer.toFixed(0).padStart(6)}  ${winter.toFixed(0).padStart(6)}  ${all.toFixed(0).padStart(8)}  ${(b.b / Math.max(b.n, 1)).toFixed(0).padStart(6)}  ${(b.d / Math.max(b.n, 1)).toFixed(0).padStart(7)}  ${bar(all, peakValue)}`;
        }),
        "",
        `  diffuse is ${diffuseShare.toFixed(0)}% of global across the year, which is the share a tracker cannot recover`,
        `  ${nights} of ${rows.length} hourly record(s) report zero irradiation`,
        "",
        "Sunrise to sunset sits where the bar leaves zero; the shift between the summer and winter columns is the daylight saving a fixed array gives up.",
        "Source: PVGIS typical meteorological year, UTC hours, horizontal plane.",
    ].join("\n");
}
