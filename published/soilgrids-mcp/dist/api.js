/**
 * ISRIC SoilGrids — keyless public API client.
 */
const BASE = "https://rest.isric.org/soilgrids/v2.0";
const SOURCE = "ISRIC SoilGrids";
export class SourceError extends Error {
}
async function request(path, accept = "application/json", timeoutMs = 25000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(path.startsWith("http") ? path : BASE + path, {
            signal: ctrl.signal,
            headers: { "user-agent": "soilgrids-mcp", accept },
        });
        if (!res.ok)
            throw new SourceError(`${SOURCE} responded ${res.status}`);
        return res;
    }
    catch (e) {
        if (e instanceof SourceError)
            throw e;
        if (e.name === "AbortError")
            throw new SourceError(`${SOURCE} request timed out`);
        throw new SourceError(`${SOURCE} request failed: ${e.message}`);
    }
    finally {
        clearTimeout(timer);
    }
}
export async function getJson(path, accept = "application/json", timeoutMs = 25000) {
    const res = await request(path, accept, timeoutMs);
    const body = await res.text();
    try {
        return JSON.parse(body);
    }
    catch {
        throw new SourceError(`${SOURCE} returned malformed JSON`);
    }
}
export function clean(s) {
    return String(s ?? "").replace(/\s+/g, " ").trim();
}
const PROPERTIES = [
    ["clay", "Clay fraction (g/kg)"],
    ["sand", "Sand fraction (g/kg)"],
    ["silt", "Silt fraction (g/kg)"],
    ["soc", "Soil organic carbon (dg/kg) - topsoil only for ocs"],
    ["ocs", "Organic carbon stock (t/ha) - 0-30cm only"],
    ["bdod", "Bulk density (cg/cm3)"],
    ["cec", "Cation exchange capacity (mmol(c)/kg)"],
    ["cfvo", "Coarse fragments (cm3/dm3)"],
    ["nitrogen", "Total nitrogen (cg/kg)"],
    ["ocd", "Organic carbon density (hg/m3)"],
    ["phh2o", "pH in water (x10)"],
    ["wv0010", "Volumetric water content at 10kPa (cm3/100cm3)"],
    ["wv0033", "Volumetric water content at 33kPa"],
    ["wv1500", "Volumetric water content at 1500kPa"],
];
const DEPTHS = ["0-5cm", "5-15cm", "15-30cm", "30-60cm", "60-100cm", "100-200cm"];
function checkCoord(lat, lon) {
    if (!Number.isFinite(lat) || lat < -90 || lat > 90)
        throw new SourceError("lat must be between -90 and 90");
    if (!Number.isFinite(lon) || lon < -180 || lon > 180)
        throw new SourceError("lon must be between -180 and 180");
}
export async function soilProperties(a) {
    checkCoord(a.lat, a.lon);
    const wanted = clean(a.properties || "clay,sand,silt,soc,phh2o").split(",").map((s) => clean(s)).filter(Boolean);
    const unknown = wanted.filter((p) => !PROPERTIES.some(([code]) => code === p));
    if (unknown.length)
        throw new SourceError(`unknown property code(s): ${unknown.join(", ")} - see list_soil_codes`);
    const layers = clean(a.depths || "0-5cm,5-15cm,15-30cm").split(",").map((s) => clean(s)).filter(Boolean);
    const badDepth = layers.filter((d) => !DEPTHS.includes(d));
    if (badDepth.length)
        throw new SourceError(`unknown depth(s): ${badDepth.join(", ")} - allowed: ${DEPTHS.join(", ")}`);
    const params = [
        `lon=${a.lon}`,
        `lat=${a.lat}`,
        ...wanted.map((p) => `property=${encodeURIComponent(p)}`),
        ...layers.map((d) => `depth=${encodeURIComponent(d)}`),
        "value=mean",
    ];
    const data = await getJson(`/properties/query?${params.join("&")}`, "application/json", 60000);
    const layersOut = Array.isArray(data?.properties?.layers) ? data.properties.layers : [];
    if (!layersOut.length)
        throw new SourceError(`SoilGrids has no data at ${a.lat}, ${a.lon} (probably water or outside the global grid)`);
    const lines = [`SoilGrids at ${a.lat}, ${a.lon}:`, ""];
    for (const layer of layersOut) {
        const unit = clean(layer?.unit_measure?.mapped_units);
        const target = clean(layer?.unit_measure?.target_units);
        const factor = Number(layer?.unit_measure?.d_factor ?? 1);
        lines.push(`${clean(layer?.name)} (${unit}${target ? ` -> ${target}, divide by ${factor}` : ""}):`);
        for (const depth of Array.isArray(layer?.depths) ? layer.depths : []) {
            const mean = depth?.values?.mean;
            const note = clean(depth?.values?.uncertainty);
            lines.push(`   ${clean(depth?.label)}: ${mean === undefined || mean === null ? "-" : mean}${note ? ` (uncertainty ${note})` : ""}`);
        }
        lines.push("");
    }
    return lines.join("\n").trim();
}
export async function classifySoil(a) {
    checkCoord(a.lat, a.lon);
    const classes = Math.floor(a.classes ?? 3);
    if (!Number.isInteger(classes) || classes < 1 || classes > 5)
        throw new SourceError("classes must be between 1 and 5");
    const data = await getJson(`/classification/query?lon=${a.lon}&lat=${a.lat}&number_classes=${classes}`, "application/json", 60000);
    if (!data?.wrb_class_name)
        throw new SourceError(`SoilGrids has no classification at ${a.lat}, ${a.lon}`);
    const probs = Array.isArray(data.wrb_class_probability) ? data.wrb_class_probability : [];
    return [
        `Most likely WRB class at ${a.lat}, ${a.lon}: ${clean(data.wrb_class_name)} (code ${data.wrb_class_value})`,
        "",
        probs.length ? "Candidate classes:" : "",
        ...probs.map(([name, pct]) => `- ${clean(name)}: ${pct}%`),
        Number.isFinite(data.query_time_s) ? `\nQuery took ${Number(data.query_time_s).toFixed(1)}s at ISRIC.` : "",
    ].filter(Boolean).join("\n");
}
export async function listSoilCodes() {
    return [
        "Property codes:",
        "",
        ...PROPERTIES.map(([code, desc]) => `- ${code}: ${desc}`),
        "",
        "Depth layers:",
        ...DEPTHS.map((d) => `- ${d}`),
        "",
        "ocs is only available for 0-30cm as a whole; the others accept every layer.",
    ].join("\n");
}
