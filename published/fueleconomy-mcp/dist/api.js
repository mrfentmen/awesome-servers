/**
 * FuelEconomy.gov client, keyless.
 * The public REST service at /ws/rest returns XML for menus and accepts JSON for fuel prices.
 */
export class FuelError extends Error {
    constructor(message) {
        super(message);
        this.name = "FuelError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = "mrfentmen-fueleconomy-mcp/1.0";
const BASE = "https://www.fueleconomy.gov/ws/rest";
async function get(path, accept) {
    let res;
    try {
        res = await fetch(BASE + path, {
            headers: { "User-Agent": UA, Accept: accept === "json" ? "application/json" : "application/xml" },
            signal: AbortSignal.timeout(20000),
        });
    }
    catch (e) {
        throw new FuelError(`Could not reach fueleconomy.gov: ${errorMessage(e)}`);
    }
    if (res.status === 404)
        throw new FuelError("No such record on fueleconomy.gov.");
    if (res.status === 204 || (res.status === 200 && res.headers.get("content-length") === "0")) {
        return "";
    }
    if (!res.ok) {
        const body = (await res.text()).slice(0, 200);
        throw new FuelError(`fueleconomy.gov returned HTTP ${res.status}: ${body}`);
    }
    return res.text();
}
function decodeEntities(s) {
    return s
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#0?39;|&apos;/g, "'")
        .replace(/&amp;/g, "&");
}
/** Pull `<tag>value</tag>` pairs out of a flat XML document. */
export function xmlFields(xml) {
    const out = {};
    const body = xml.replace(/<\?xml[^>]*\?>/, "");
    const re = /<([A-Za-z][\w]*)>([^<]*)<\/\1>/g;
    let m;
    while ((m = re.exec(body)) !== null) {
        if (!(m[1] in out))
            out[m[1]] = decodeEntities(m[2]).trim();
    }
    return out;
}
/** Pull the `<menuItem><text>..</text><value>..</value></menuItem>` rows out of a menu document. */
export function xmlMenu(xml) {
    const out = [];
    const re = /<menuItem>\s*<text>([^<]*)<\/text>\s*<value>([^<]*)<\/value>\s*<\/menuItem>/g;
    let m;
    while ((m = re.exec(xml)) !== null) {
        out.push({ text: decodeEntities(m[1]), value: decodeEntities(m[2]) });
    }
    return out;
}
export function toVehicle(f) {
    return {
        id: f.id ?? "?",
        year: f.year ?? "?",
        make: f.make ?? "?",
        model: f.model ?? "?",
        transmission: f.trany ?? "",
        drive: f.drive ?? "",
        fuel: f.fuelType1 ?? f.fuelType ?? "",
        cylinders: f.cylinders ?? "",
        displacement: f.displ ?? "",
        vehicleClass: f.VClass ?? "",
        city: f.city08 ?? "",
        highway: f.highway08 ?? "",
        combined: f.comb08 ?? "",
        co2: f.co2TailpipeGpm ?? "",
        annualFuelCost: f.fuelCost08 ?? "",
        ghgScore: f.ghgScore ?? "",
        feScore: f.feScore ?? "",
        range: f.range ?? f.rangeCity ?? "",
    };
}
export function formatVehicle(v) {
    const lines = [
        `${v.year} ${v.make} ${v.model}`,
        `  vehicle id    ${v.id}`,
        `  fuel          ${v.fuel || "unknown"}`,
        `  transmission  ${v.transmission || "unknown"}`,
        `  engine        ${[v.displacement ? `${v.displacement}L` : "", v.cylinders ? `${v.cylinders} cyl` : ""]
            .filter(Boolean)
            .join(" ") || "unknown"}`,
        `  drive         ${v.drive || "unknown"}`,
        `  class         ${v.vehicleClass || "unknown"}`,
        `  MPG           city ${v.city || "?"} | highway ${v.highway || "?"} | combined ${v.combined || "?"}`,
        `  CO2           ${v.co2 ? `${v.co2} g/mile` : "n/a"}`,
        `  fuel cost     ${v.annualFuelCost ? `$${v.annualFuelCost}/year` : "n/a"}`,
        `  scores        smog ${v.feScore || "?"} / greenhouse ${v.ghgScore || "?"}`,
    ];
    if (v.range)
        lines.push(`  range         ${v.range} miles`);
    return lines.join("\n");
}
export async function listYears() {
    return xmlMenu(await get("/vehicle/menu/year", "xml")).map((i) => i.value);
}
export async function listMakes(year) {
    requireYear(year);
    return xmlMenu(await get(`/vehicle/menu/make?year=${encodeURIComponent(year)}`, "xml"));
}
export async function listModels(year, make) {
    requireYear(year);
    if (!make.trim())
        throw new FuelError("A make is required - call list_makes for the options.");
    return xmlMenu(await get(`/vehicle/menu/model?year=${encodeURIComponent(year)}&make=${encodeURIComponent(make)}`, "xml"));
}
export async function listOptions(year, make, model) {
    requireYear(year);
    if (!make.trim() || !model.trim()) {
        throw new FuelError("Both a make and a model are required - call list_models first.");
    }
    return xmlMenu(await get(`/vehicle/menu/options?year=${encodeURIComponent(year)}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`, "xml"));
}
function requireYear(year) {
    if (!/^\d{4}$/.test(year.trim())) {
        throw new FuelError(`"${year}" is not a four-digit model year - call list_years for the valid range.`);
    }
}
export async function vehicleDetails(vehicleId) {
    const id = vehicleId.trim();
    if (!/^\d{1,7}$/.test(id)) {
        throw new FuelError(`"${vehicleId}" is not a vehicle id - call list_options to find one.`);
    }
    const xml = await get(`/vehicle/${id}`, "xml");
    if (!xml)
        throw new FuelError(`No vehicle with id ${id}.`);
    return toVehicle(xmlFields(xml));
}
export async function compareVehicles(vehicleIds) {
    const ids = vehicleIds.map((v) => v.trim()).filter(Boolean).slice(0, 6);
    if (ids.length === 0)
        throw new FuelError("Give at least one vehicle id.");
    const vehicles = await Promise.all(ids.map((id) => vehicleDetails(id)));
    if (vehicles.length === 1)
        return formatVehicle(vehicles[0]);
    const best = vehicles
        .filter((v) => Number(v.combined) > 0)
        .sort((a, b) => Number(b.combined) - Number(a.combined))[0];
    const rows = vehicles.map((v, i) => formatVehicle(v).replace(/^/, `#${i + 1} `).replace(/\n/g, "\n   "));
    const tail = best
        ? `\n\nBest combined MPG: ${best.year} ${best.make} ${best.model} at ${best.combined} MPG.`
        : "";
    return `Comparing ${vehicles.length} vehicles:\n\n${rows.join("\n\n")}${tail}`;
}
export async function fuelPrices() {
    const raw = await get("/fuelprices", "json");
    if (!raw)
        throw new FuelError("fueleconomy.gov returned no fuel prices right now.");
    const prices = JSON.parse(raw);
    const order = [
        ["regular", "Regular gasoline"],
        ["midgrade", "Midgrade gasoline"],
        ["premium", "Premium gasoline"],
        ["diesel", "Diesel"],
        ["e85", "E85"],
        ["cng", "CNG"],
        ["lpg", "LPG"],
        ["electric", "Electricity"],
    ];
    const lines = order
        .filter(([k]) => prices[k])
        .map(([k, label]) => {
        const unit = k === "electric" ? "$/kWh" : "$/gallon";
        return `  ${label.padEnd(20)} $${prices[k]} ${unit}`;
    });
    return [
        "US national average fuel prices (fueleconomy.gov):",
        "",
        ...lines,
        "",
        "Updated weekly by the US Department of Energy.",
    ].join("\n");
}
// ---- batch-4 tools: running cost estimates (2026-09-27) ----
const FUEL_KEYS = [
    [/diesel/i, "diesel"],
    [/e85|ethanol/i, "e85"],
    [/electric|electricity|ev\b/i, "electric"],
    [/premium/i, "premium"],
    [/midgrade/i, "midgrade"],
    [/cng/i, "cng"],
    [/lpg|propane/i, "lpg"],
];
function fuelKey(fuel) {
    for (const [pattern, key] of FUEL_KEYS) {
        if (pattern.test(fuel))
            return key;
    }
    return "regular";
}
async function nationalPrices() {
    const raw = await get("/fuelprices", "json");
    if (!raw)
        return {};
    try {
        return JSON.parse(raw);
    }
    catch {
        return {};
    }
}
const clampMiles = (value) => Math.min(Math.max(Number(value ?? 12000) || 12000, 500), 100000);
/** Annual fuel cost for one vehicle at a chosen mileage, from the EPA record. */
export async function runningCost(args) {
    const vehicle = await vehicleDetails(args.vehicle_id);
    const miles = clampMiles(args.miles_per_year);
    const mpg = Number(vehicle.combined);
    if (!Number.isFinite(mpg) || mpg <= 0) {
        throw new FuelError(`${vehicle.year} ${vehicle.make} ${vehicle.model} has no combined MPG in the EPA record, so cost cannot be estimated.`);
    }
    const key = fuelKey(vehicle.fuel);
    const givenPrice = Number(args.fuel_price);
    const useNational = !Number.isFinite(givenPrice);
    const price = useNational ? Number((await nationalPrices())[key]) : givenPrice;
    if (!Number.isFinite(price) || price <= 0) {
        throw new FuelError("No usable fuel price: pass fuel_price, or the national average for this fuel is unavailable.");
    }
    const gallons = miles / mpg;
    const cost = gallons * price;
    const co2 = Number(vehicle.co2);
    const unit = key === "electric" ? "$/kWh" : "$/gallon";
    return [
        `Running cost for ${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        `EPA combined ${vehicle.combined} MPG over ${miles.toLocaleString()} miles/year`,
        useNational
            ? `Fuel price: $${price} ${unit} (national average for ${vehicle.fuel || "regular"})`
            : `Fuel price: $${price}/gallon as given`,
        `Fuel used: ${gallons.toFixed(1)} ${key === "electric" ? "kWh" : "gallons"}/year | cost $${cost.toFixed(0)}/year ($${(cost / miles).toFixed(3)}/mile)`,
        Number.isFinite(co2) && co2 > 0 ? `Tailpipe CO2 at this mileage: ${((co2 * miles) / 1000000).toFixed(2)} tonnes/year` : "",
        "Estimate only - real efficiency and local prices differ.",
    ].filter(Boolean).join("\n");
}
/** Ranks two to six vehicles by estimated annual fuel cost at the same mileage. */
export async function compareCosts(args) {
    const ids = (args.vehicle_ids ?? "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 6);
    if (ids.length < 2)
        throw new FuelError("Give two to six vehicle ids, comma separated.");
    const miles = clampMiles(args.miles_per_year);
    const givenPrice = Number(args.fuel_price);
    const prices = Number.isFinite(givenPrice) ? null : await nationalPrices();
    const rows = [];
    for (const id of ids) {
        const v = await vehicleDetails(id);
        const mpg = Number(v.combined);
        const price = Number.isFinite(givenPrice) ? givenPrice : Number(prices?.[fuelKey(v.fuel)]);
        const cost = mpg > 0 && Number.isFinite(price) && price > 0 ? (miles / mpg) * price : NaN;
        rows.push({ label: `${v.year} ${v.make} ${v.model}`, cost, mpg, fuel: v.fuel || "regular", co2: Number(v.co2) });
    }
    const ranked = [...rows].filter((r) => Number.isFinite(r.cost)).sort((a, b) => a.cost - b.cost);
    if (!ranked.length)
        throw new FuelError("None of those vehicles has both an MPG figure and a usable fuel price.");
    const worst = ranked[ranked.length - 1];
    const best = ranked[0];
    return [
        `Annual fuel cost at ${miles.toLocaleString()} miles/year (${givenPrice ? `$${givenPrice}/gallon` : "national average prices"}):`,
        ...ranked.map((r, i) => `${i + 1}. ${r.label} | ${r.mpg} MPG | $${r.cost.toFixed(0)}/year${Number.isFinite(r.co2) && r.co2 > 0 ? ` | ${((r.co2 * miles) / 1000000).toFixed(2)} t CO2/year` : ""}`),
        "",
        ranked.length > 1
            ? `Cheapest to run: ${best.label} at $${best.cost.toFixed(0)}/year, $${(worst.cost - best.cost).toFixed(0)}/year less than ${worst.label}.`
            : "",
        "Estimates from EPA combined MPG; real-world mileage varies.",
    ].filter(Boolean).join("\n");
}
// ---- muxG tools:
const NHTSA = "https://api.nhtsa.gov";
function vehicleWords(year, make, model) {
    const y = Math.floor(Number(year));
    if (!Number.isFinite(y) || y < 1900 || y > 2100)
        throw new Error(`"${year}" is not a plausible model year.`);
    const m = (make ?? "").trim();
    const d = (model ?? "").trim();
    if (!m || !/^[a-z0-9 .'-]{2,40}$/i.test(m))
        throw new Error("Make must be 2-40 letters, e.g. honda.");
    if (!d || !/^[a-z0-9 .'-]{1,40}$/i.test(d))
        throw new Error("Model must be 1-40 letters, e.g. civic.");
    return { year: y, make: m, model: d };
}
async function nhtsaJson(path) {
    const url = `${NHTSA}${path}`;
    let res;
    try {
        res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(25000) });
    }
    catch (e) {
        throw new Error(`Network error from NHTSA: ${e.message}`);
    }
    if (!res.ok)
        throw new Error(`NHTSA returned ${res.status} for ${path}`);
    const body = await res.text();
    if (!body.trim())
        throw new Error("NHTSA returned an empty body.");
    return JSON.parse(body);
}
export async function modelRecalls(args) {
    const { year, make, model } = vehicleWords(args.year, args.make, args.model);
    const limit = Math.max(1, Math.min(Math.floor(args.limit ?? 5) || 5, 15));
    const data = await nhtsaJson(`/recalls/recallsByVehicle?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&modelYear=${year}`);
    const rows = data?.results ?? [];
    if (!rows.length)
        throw new Error(`NHTSA lists no safety recalls for the ${year} ${make} ${model}.`);
    const urgent = rows.filter((r) => r.parkIt === true);
    const components = new Map();
    for (const row of rows) {
        const key = row.Component ?? "component not reported";
        components.set(key, (components.get(key) ?? 0) + 1);
    }
    const top = Array.from(components.entries()).sort((a, b) => b[1] - a[1]).slice(0, 4);
    const lines = [
        `${year} ${make} ${model} — ${rows.length} safety recall${rows.length === 1 ? "" : "s"} on file with NHTSA`,
        urgent.length ? `${urgent.length} campaign(s) carry a park-it notice.` : "No park-it notice on any of these campaigns.",
        `Most cited components: ${top.map(([name, count]) => `${name.slice(0, 50)} (${count})`).join("; ")}`,
        "",
    ];
    for (const row of rows.slice(0, limit)) {
        lines.push(`  ${row.NHTSACampaignNumber ?? "campaign not reported"} — ${(row.Component ?? "component not reported").slice(0, 80)}`);
        lines.push(`    filed ${row.ReportReceivedDate ?? "not reported"}${row.overTheAirUpdate === true ? " · over-the-air update" : ""}`);
        if (row.Summary)
            lines.push(`    ${row.Summary.slice(0, 260)}`);
        if (row.Consequence)
            lines.push(`    consequence: ${row.Consequence.slice(0, 160)}`);
        if (row.Remedy)
            lines.push(`    remedy: ${row.Remedy.slice(0, 160)}`);
    }
    if (rows.length > limit)
        lines.push(`  ...and ${rows.length - limit} more campaign(s).`);
    return lines.join("\n");
}
export async function modelComplaints(args) {
    const { year, make, model } = vehicleWords(args.year, args.make, args.model);
    const limit = Math.max(1, Math.min(Math.floor(args.limit ?? 5) || 5, 15));
    const data = await nhtsaJson(`/complaints/complaintsByVehicle?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&modelYear=${year}`);
    const rows = data?.results ?? [];
    if (!rows.length)
        throw new Error(`NHTSA lists no owner complaints for the ${year} ${make} ${model}.`);
    const total = typeof data.count === "number" ? data.count : rows.length;
    const crashes = rows.filter((r) => r.crash === true).length;
    const fires = rows.filter((r) => r.fire === true).length;
    const deaths = rows.reduce((sum, r) => sum + (Number(r.numberOfDeaths) || 0), 0);
    const injuries = rows.reduce((sum, r) => sum + (Number(r.numberOfInjuries) || 0), 0);
    const components = new Map();
    for (const row of rows) {
        for (const part of String(row.components ?? "component not reported").split(":")) {
            const key = part.trim();
            if (key)
                components.set(key, (components.get(key) ?? 0) + 1);
        }
    }
    const top = Array.from(components.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const lines = [
        `${year} ${make} ${model} — ${total.toLocaleString()} owner complaint${total === 1 ? "" : "s"} filed with NHTSA`,
        `In this page of ${rows.length}: ${crashes} crash, ${fires} fire · ${deaths} death(s), ${injuries} injury(ies) reported`,
        `Most cited components: ${top.length ? top.map(([name, count]) => `${name.slice(0, 40)} (${count})`).join("; ") : "not reported"}`,
        "",
    ];
    for (const row of rows.slice(0, limit)) {
        lines.push(`  ${(row.components ?? "component not reported").slice(0, 80)} — filed ${row.dateComplaintFiled ?? "not reported"} (odi ${row.odiNumber ?? "not reported"})`);
        if (row.summary)
            lines.push(`    ${row.summary.slice(0, 240)}`);
    }
    if (rows.length > limit)
        lines.push(`  ...and ${rows.length - limit} more complaint(s) in this page.`);
    return lines.join("\n");
}
