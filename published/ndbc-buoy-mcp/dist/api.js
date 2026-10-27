const BASE = "https://www.ndbc.noaa.gov/data/realtime2";
const UA = "mrfentmen-ndbc-buoy-mcp/1.0 (https://github.com/mrfentmen)";
export class NdbcError extends Error {
}
const STD_HEADERS = ["YY", "MM", "DD", "hh", "mm", "WDIR", "WSPD", "GST", "WVHT", "DPD", "APD", "MWD", "PRES", "ATMP", "WTMP", "DEWP", "VIS", "PTDY"];
async function getText(stationId) {
    const res = await fetch(`${BASE}/${encodeURIComponent(stationId)}.txt`, {
        headers: { "User-Agent": UA },
        signal: AbortSignal.timeout(30000),
    });
    if (!res.ok)
        throw new NdbcError(`NDBC returned HTTP ${res.status} for station ${stationId}`);
    return await res.text();
}
export async function station(args) {
    const id = (args.stationId ?? "").trim();
    if (!/^\d{5,7}$/.test(id))
        throw new NdbcError("Provide a numeric station ID like 41008");
    const text = await getText(id);
    const lines = text.split("\n").filter((l) => l.trim().length > 0);
    const headerIdx = lines.findIndex((l) => !l.startsWith("#"));
    if (headerIdx < 0)
        throw new NdbcError(`No data for station ${id}`);
    const headers = lines[headerIdx].trim().split(/\s+/);
    const data = lines.slice(headerIdx + 1).map((l) => l.trim().split(/\s+/)).filter((r) => r.length >= headers.length);
    if (!data.length)
        throw new NdbcError(`No observations for station ${id}`);
    const recent = data.slice(0, 6);
    const rows = recent.map((r) => {
        const get = (h) => {
            const idx = headers.indexOf(h);
            return idx >= 0 ? r[idx] : undefined;
        };
        const wdir = get("WDIR");
        const wspd = get("WSPD");
        const gst = get("GST");
        const wvht = get("WVHT");
        const dpd = get("DPD");
        const atmp = get("ATMP");
        const wtmp = get("WTMP");
        const pres = get("PRES");
        const date = [get("YY"), get("MM"), get("DD"), get("hh"), get("mm")].join("-");
        const parts = [`${date}Z`];
        if (wvht && wvht !== "MM")
            parts.push(`wave ${wvht} m (period ${dpd ?? "?"} s)`);
        if (wdir && wspd && wspd !== "MM")
            parts.push(`wind ${wspd} kt from ${wdir}${gst && gst !== "MM" ? ` gust ${gst}` : ""}`);
        if (atmp && atmp !== "MM")
            parts.push(`air ${atmp} C`);
        if (wtmp && wtmp !== "MM")
            parts.push(`water ${wtmp} C`);
        if (pres && pres !== "MM")
            parts.push(`pressure ${pres} mb`);
        return parts.join(" | ");
    });
    return `Buoy ${id} (latest ${rows.length} observations):\n` + rows.join("\n");
}
// ---- muxB tools:
async function activeStations() {
    const res = await fetch("https://www.ndbc.noaa.gov/activestations.xml", {
        headers: { "User-Agent": UA },
        signal: AbortSignal.timeout(40000),
    });
    if (!res.ok)
        throw new NdbcError(`NDBC returned HTTP ${res.status} for the active station list`);
    const xml = await res.text();
    const out = [];
    for (const tag of xml.match(/<station\b[^>]*\/>/g) ?? []) {
        const row = {};
        for (const attr of tag.match(/[a-z]+="[^"]*"/g) ?? []) {
            const eq = attr.indexOf("=");
            row[attr.slice(0, eq)] = attr.slice(eq + 2, -1);
        }
        if (row.id)
            out.push(row);
    }
    if (!out.length)
        throw new NdbcError("NDBC active station list could not be parsed");
    return out;
}
const toRad = (deg) => (deg * Math.PI) / 180;
