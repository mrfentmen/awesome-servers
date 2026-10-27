const BASE = "https://ssd-api.jpl.nasa.gov";
const UA = "mrfentmen-jpl-sbdb-mcp/1.0 (https://github.com/mrfentmen)";
export class SbdbError extends Error {
}
async function get(url) {
    const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(30000),
    });
    if (!res.ok)
        throw new SbdbError(`JPL SBDB returned HTTP ${res.status}`);
    return (await res.json());
}
export async function object(args) {
    const name = (args.name ?? "").trim();
    if (!name)
        throw new SbdbError("Provide a designation like 1P or 433");
    const d = await get(`${BASE}/sbdb.api?sstr=${encodeURIComponent(name)}`);
    const o = d?.object;
    if (!o)
        throw new SbdbError(`Small body not found: ${name}`);
    const orb = d?.orbit ?? {};
    const lines = [
        `${o?.shortname ?? name}${o?.fullname ? ` (${o.fullname})` : ""}`,
    ];
    if (d?.discovery) {
        const disc = d.discovery;
        lines.push(`Discovered: ${disc?.date ?? "n/a"}${disc?.site ?? "" ? ` at ${disc.site}` : ""}${disc?.observer ?? "" ? ` by ${disc.observer}` : ""}`);
    }
    if (orb?.e != null)
        lines.push(`Eccentricity: ${orb.e}`);
    if (orb?.a != null)
        lines.push(`Semimajor axis: ${orb.a} au`);
    if (orb?.q != null)
        lines.push(`Perihelion: ${orb.q} au`);
    if (orb?.tp != null)
        lines.push(`Perihelion date: ${String(orb.tp).slice(0, 10)}`);
    if (orb?.H != null)
        lines.push(`Absolute magnitude: ${orb.H}`);
    const ca = (d?.close_approach ?? []);
    if (ca.length) {
        const first = ca[0];
        lines.push(`Next close approach: ${first?.cd ?? "n/a"} | dist ${first?.dist ?? "n/a"} au | rel velocity ${first?.v_rel ?? "n/a"} km/s`);
    }
    return lines.join("\n");
}
export async function browse(args) {
    const limit = Math.min(args.limit ?? 10, 20);
    const d = await get(`${BASE}/sbdb_query.api?fields=full_name,spkid,neo&sb-kind=a&limit=${limit}`);
    const data = (d?.data ?? []);
    const fields = (d?.fields ?? []);
    if (!data.length)
        return "No small bodies found";
    const rows = data.map((r, i) => {
        const get = (f) => {
            const idx = fields.indexOf(f);
            return idx >= 0 ? r[idx] : "";
        };
        return `${i + 1}. ${get("full_name")}${get("neo") === "Y" ? " [NEO]" : ""} | ${get("spkid")}`;
    });
    return `Small bodies (${data.length} shown):\n` + rows.join("\n");
}
