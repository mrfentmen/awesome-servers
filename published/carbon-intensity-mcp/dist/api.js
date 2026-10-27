const BASE = "https://api.carbonintensity.org.uk";
const UA = "mrfentmen-carbon-intensity-mcp/1.0 (https://github.com/mrfentmen)";
export class CarbonError extends Error {
}
async function get(url) {
    const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(30000),
    });
    if (!res.ok)
        throw new CarbonError(`Carbon Intensity returned HTTP ${res.status}`);
    return (await res.json());
}
function fmtIntensity(row) {
    const from = row?.from ? new Date(row.from).toISOString().slice(11, 16) : "?";
    const actual = row?.intensity?.actual ?? row?.intensity?.forecast;
    const index = row?.intensity?.index ?? "";
    return `${from}: ${actual != null ? `${Math.round(actual)} gCO2/kWh` : "n/a"} (${index})`;
}
export async function intensity(_args) {
    const d = await get(`${BASE}/intensity`);
    const row = d?.data?.[0];
    if (!row)
        throw new CarbonError("No intensity data");
    const from = row?.from ? new Date(row.from).toISOString().replace("T", " ").slice(0, 16) : "?";
    const actual = row?.intensity?.actual ?? row?.intensity?.forecast;
    return `UK grid carbon intensity at ${from}:\n  ${actual != null ? `${Math.round(actual)} gCO2/kWh` : "n/a"} (${row?.intensity?.index ?? ""})`;
}
export async function forecast(args) {
    const limit = Math.min(args.limit ?? 24, 48);
    const from = new Date();
    const to = new Date(from.getTime() + 48 * 3600000);
    const f = from.toISOString().slice(0, 16) + "Z";
    const t = to.toISOString().slice(0, 16) + "Z";
    const d = await get(`${BASE}/intensity/${f}/${t}`);
    const rows = (d?.data ?? []).slice(0, limit);
    if (!rows.length)
        throw new CarbonError("No forecast data");
    return `UK carbon intensity forecast (next ${rows.length} half hours):\n` + rows.map(fmtIntensity).join("\n");
}
export async function regional(_args) {
    const d = await get(`${BASE}/regional`);
    const regions = d?.data?.[0]?.regions ?? [];
    if (!regions.length)
        throw new CarbonError("No regional data");
    const rows = regions
        .sort((a, b) => (a?.intensity?.forecast ?? 0) - (b?.intensity?.forecast ?? 0))
        .map((r, i) => `${i + 1}. ${r?.shortname ?? "n/a"}: ${r?.intensity?.forecast != null ? `${Math.round(r.intensity.forecast)} gCO2/kWh` : "n/a"} (${r?.intensity?.index ?? ""})`);
    return `UK regional carbon intensity (cleanest first):\n` + rows.join("\n");
}
// ---- muxA tools:
const CARBON = "https://api.carbonintensity.org.uk";
async function ciGet(path) {
    const res = await fetch(`${CARBON}${path}`, {
        headers: { "User-Agent": "mrfentmen-carbon-intensity-mcp/1.0 (https://github.com/mrfentmen)", Accept: "application/json" },
        signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) {
        const body = (await res.json().catch(() => ({})));
        throw new CarbonError(`Carbon Intensity returned HTTP ${res.status}${body.error ? `: ${String(body.error)}` : ""}`);
    }
    return (await res.json());
}
function at(value) {
    return value != null ? String(value) : "not reported";
}
export async function nationalFuelMix(args) {
    const d = await ciGet("/intensity");
    const row = (d?.data ?? [])[0];
    const mix = (row?.generationmix ?? []);
    if (!mix.length) {
        // The national endpoint sometimes omits the mix, so fall back to a roll up.
        const reg = await ciGet("/regional");
        const regions = (reg?.data?.[0]?.regions ?? []);
        const totals = new Map();
        for (const r of regions) {
            for (const m of (r.generationmix ?? [])) {
                totals.set(String(m.fuel ?? "?"), (totals.get(String(m.fuel ?? "?")) ?? 0) + (Number(m.perc) || 0));
            }
        }
        if (!totals.size)
            throw new CarbonError("Carbon Intensity returned no generation mix for the national or regional endpoints.");
        // Each region reports its own mix as a percentage of itself, so the totals
        // are divided by the region count to give a mean share rather than a sum.
        const n = regions.length;
        const mean = new Map();
        for (const [fuel, total] of totals)
            mean.set(fuel, total / n);
        const sum = [...mean.values()].reduce((a, b) => a + b, 0);
        const sorted = [...mean.entries()].sort((a, b) => b[1] - a[1]);
        const fossil = ["coal", "gas", "oil"].reduce((a, f) => a + (mean.get(f) ?? 0), 0);
        return [
            `UK generation mix, averaged across ${n} DNO regions because the national endpoint did not publish a mix right now.`,
            `Mean reported share per region: ${sum.toFixed(0)}% across ${mean.size} fuel(s).`,
            ...sorted.map(([k, v], i) => `${i + 1}. ${k} | ${v.toFixed(1)}% mean regional share`),
            `Fossil fuels (coal, gas, oil) average ${fossil.toFixed(1)}% of regional generation.`,
            "This is a mean across distribution regions, not a national generation total, so treat it as the typical regional mix.",
        ].join("\n");
    }
    const total = mix.reduce((a, m) => a + (Number(m.perc) || 0), 0);
    const sorted = [...mix].sort((a, b) => (Number(b.perc) || 0) - (Number(a.perc) || 0));
    const fuelPerc = (f) => Number(mix.find((m) => String(m.fuel).toLowerCase() === f)?.perc ?? 0);
    const fossil = ["coal", "gas", "oil"].reduce((a, f) => a + fuelPerc(f), 0);
    const renewable = ["wind", "solar", "hydro", "biomass"].reduce((a, f) => a + fuelPerc(f), 0);
    const wanted = (args.fuel ?? "").trim().toLowerCase();
    return [
        `UK national generation mix at ${String(row?.from ?? "unknown time")}, total reported share ${total.toFixed(0)}%.`,
        wanted ? `Highlighted fuel ${wanted}: ${fuelPerc(wanted)}%.` : "",
        `Renewables and biomass combined: ${renewable.toFixed(0)}% | fossil combined: ${fossil.toFixed(0)}% | imports: ${fuelPerc("imports")}% | nuclear: ${fuelPerc("nuclear")}%`,
        "",
        ...sorted.map((m, i) => `${i + 1}. ${String(m.fuel ?? "?")} | ${Number(m.perc ?? 0)}%`),
        "Shares are live generation, so they move through the day. Carbon intensity is driven by this mix, which is why the two tools answer different questions.",
    ]
        .filter((l) => l !== "")
        .join("\n");
}
