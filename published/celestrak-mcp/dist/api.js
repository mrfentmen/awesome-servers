const BASE = "https://celestrak.org/NORAD/elements/gp.php";
const UA = "mrfentmen-celestrak-mcp/1.0 (https://github.com/mrfentmen)";
export class CelestrakError extends Error {
}
async function get(url) {
    const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(30000),
    });
    if (!res.ok)
        throw new CelestrakError(`CelesTrak returned HTTP ${res.status}`);
    return (await res.json());
}
function fmtSat(s, i) {
    const epoch = (s.EPOCH ?? "").replace(" ", "T");
    return `${i + 1}. ${s.OBJECT_NAME ?? "n/a"} | NORAD ${s.NORAD_CAT_ID ?? "n/a"} | ${s.OBJECT_ID ?? "n/a"}\n   Epoch ${epoch || "n/a"} | Inc ${s.INCLINATION ?? "n/a"} | Ecc ${s.ECCENTRICITY ?? "n/a"} | Period ${s.PERIOD ?? "n/a"} min | Mean motion ${s.MEAN_MOTION ?? "n/a"}`;
}
export async function group(args) {
    const g = (args.group ?? "stations").trim();
    const limit = Math.min(args.limit ?? 10, 30);
    const d = await get(`${BASE}?GROUP=${encodeURIComponent(g)}&FORMAT=json`);
    const sats = (d ?? []).slice(0, limit);
    if (!sats.length)
        return `No satellites found in group ${g}. Try stations, visual, active, or weather.`;
    return `Group ${g} (showing ${sats.length}):\n` + sats.map(fmtSat).join("\n");
}
export async function satellite(args) {
    const id = Number(args.noradId);
    if (!Number.isInteger(id) || id <= 0)
        throw new CelestrakError("Provide a positive NORAD catalog number");
    const d = await get(`${BASE}?CATNR=${id}&FORMAT=json`);
    const s = (d ?? [])[0];
    if (!s)
        return `No satellite found for NORAD ${id}`;
    return fmtSat(s, 0);
}
function bound(value, fallback, max) {
    return Math.max(1, Math.min(Math.round(value ?? fallback), max));
}
export async function nameSearch(args) {
    const q = (args.query ?? '').trim().toLowerCase();
    if (!q)
        throw new CelestrakError('Provide a name fragment to search for, e.g. "noaa" or "zarya"');
    const g = (args.group ?? 'stations').trim();
    const limit = bound(args.limit, 20, 100);
    const d = await get(`${BASE}?GROUP=${encodeURIComponent(g)}&FORMAT=json`);
    const sats = d ?? [];
    if (!sats.length)
        return `CelesTrak returned no satellites for group ${g}.`;
    const hits = sats.filter((s) => String(s.OBJECT_NAME ?? '').toLowerCase().includes(q));
    if (!hits.length) {
        const sample = sats.slice(0, 10).map((s) => s.OBJECT_NAME).filter(Boolean).join(', ');
        return `No satellite in group ${g} has "${args.query}" in its name. Sample names there: ${sample}`;
    }
    const shown = hits.slice(0, limit);
    return [
        `${hits.length} of ${sats.length} satellite(s) in group ${g} match "${args.query}", showing ${shown.length}.`,
        ...shown.map((s, i) => `${i + 1}. ${s.OBJECT_NAME ?? 'n/a'} | NORAD ${s.NORAD_CAT_ID ?? 'n/a'} | ${s.OBJECT_ID ?? 'n/a'}` +
            ` | inc ${s.INCLINATION ?? 'n/a'} | period ${s.PERIOD ?? 'n/a'} min`),
        hits.length > shown.length ? `...and ${hits.length - shown.length} more.` : '',
    ]
        .filter(Boolean)
        .join('\n');
}
