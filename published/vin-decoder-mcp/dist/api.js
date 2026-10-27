const BASE = "https://vpic.nhtsa.dot.gov/api/vehicles";
const UA = "mrfentmen-vin-decoder-mcp/1.0 (https://github.com/mrfentmen)";
export class VinError extends Error {
}
export async function decodeVin(args) {
    const vin = (args.vin ?? "").trim().toUpperCase();
    if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin))
        throw new VinError("Provide a valid 17 character VIN");
    let res;
    try {
        res = await fetch(`${BASE}/DecodeVin/${vin}?format=json`, {
            headers: { "User-Agent": UA },
            signal: AbortSignal.timeout(45000),
        });
    }
    catch {
        // NHTSA can be slow; one retry
        res = await fetch(`${BASE}/DecodeVin/${vin}?format=json`, {
            headers: { "User-Agent": UA },
            signal: AbortSignal.timeout(45000),
        });
    }
    if (!res.ok)
        throw new VinError(`NHTSA error ${res.status}`);
    const d = await res.json();
    const rows = d.Results ?? [];
    const pick = (name) => rows.find((r) => r.Variable === name)?.Value;
    const year = pick("Model Year");
    const make = pick("Make");
    const model = pick("Model");
    const body = pick("Body Class");
    const engine = pick("Engine Model");
    const fuel = pick("Fuel Type Primary");
    const plant = pick("Plant City");
    const trim = pick("Trim");
    const parts = [
        `${year ?? "?"} ${make ?? "?"} ${model ?? "?"}${trim ? ` ${trim}` : ""}`,
        `Body: ${body ?? "n/a"}`,
        `Engine: ${engine ?? "n/a"}`,
        `Fuel: ${fuel ?? "n/a"}`,
        `Plant: ${plant ?? "n/a"}`,
    ];
    return parts.join("\n");
}
// ---- muxF tools:
const VPIC_MAKES = "https://vpic.nhtsa.dot.gov/api/vehicles";
async function nhtsa(url) {
    const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(45000) });
    if (!res.ok)
        throw new VinError(`NHTSA error ${res.status}`);
    return (await res.json());
}
/** Look a make up in NHTSA's 12,000 entry manufacturer list, and list the models NHTSA files against it. */
export async function makeModelCatalog(args) {
    const make = (args.make ?? "").trim();
    if (!make)
        throw new VinError("Provide a make name, for example Honda");
    const limit = Math.max(1, Math.min(Math.floor(args.limit ?? 25), 60));
    const d = await nhtsa(`${VPIC_MAKES}/GetAllMakes?format=json`);
    const rows = d.Results ?? [];
    const needle = make.toLowerCase();
    const exact = rows.find((r) => (r.Make_Name ?? "").toLowerCase() === needle);
    const matches = rows.filter((r) => (r.Make_Name ?? "").toLowerCase().includes(needle)).slice(0, limit);
    const lines = [
        `NHTSA manufacturer list: ${rows.length} makes on file`,
        `Search "${make}": ${exact ? `exact match, Make_ID ${exact.Make_ID}` : "no exact match"}`,
    ];
    if (matches.length) {
        lines.push(`Matches (${matches.length}${matches.length === limit ? " or more" : ""}): ${matches
            .map((r) => `${r.Make_Name ?? "unnamed"} (#${r.Make_ID ?? "?"})`)
            .join(", ")}`);
    }
    if (!exact)
        return lines.join("\n");
    const models = await nhtsa(`${VPIC_MAKES}/GetModelsForMakeId/${exact.Make_ID}?makeId=${exact.Make_ID}&format=json`);
    const modelRows = models.Results ?? [];
    lines.push(`Models NHTSA files for ${exact.Make_Name}: ${models.Count ?? modelRows.length}`);
    if (modelRows.length) {
        lines.push(modelRows.slice(0, limit).map((m) => `- ${m.Model_Name ?? "unnamed"} (#${m.Model_ID ?? "?"})`).join("\n"));
        if (modelRows.length > limit)
            lines.push(`... and ${modelRows.length - limit} more model(s).`);
    }
    else {
        lines.push("NHTSA files no models against that make id.");
    }
    return lines.join("\n");
}
// NHTSA writes the campaign number as two digits, a letter and the rest in
// digits: 22V655000 and 16V558000 are the common nine character form, and
// longer forms such as 20V01100001 exist too. Both are accepted, and the API
// answers an unknown number with an empty result set rather than an error.
