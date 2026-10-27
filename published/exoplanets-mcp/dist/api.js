const BASE = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync";
const UA = "mrfentmen-exoplanets-mcp/1.0 (https://github.com/mrfentmen)";
export class ExoplanetError extends Error {
}
async function query(sql) {
    const res = await fetch(`${BASE}?query=${encodeURIComponent(sql)}&format=json`, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(30000) });
    if (res.status === 429)
        throw new ExoplanetError("Exoplanet Archive rate limit hit, wait and retry");
    if (!res.ok)
        throw new ExoplanetError(`Exoplanet Archive error ${res.status}`);
    return (await res.json());
}
function fmt(p, i) {
    const rad = p?.pl_rade !== undefined && p?.pl_rade !== null ? ` | radius ${p.pl_rade} Earth` : "";
    const orb = p?.pl_orbper !== undefined && p?.pl_orbper !== null ? ` | period ${p.pl_orbper} days` : "";
    const method = p?.discoverymethod ? ` | ${p.discoverymethod}` : "";
    return `${i + 1}. ${p?.pl_name ?? "Untitled"}${rad}${orb}${method}`;
}
export async function recent(args) {
    const limit = Math.min(args.limit ?? 10, 30);
    const d = await query(`select top ${limit} pl_name,pl_rade,pl_orbper,discoverymethod from ps where default_flag=1 order by disc_pubdate desc`);
    if (!d?.length)
        return "No exoplanets returned";
    return d.map(fmt).join("\n");
}
export async function byName(args) {
    const name = (args.name ?? "").trim();
    if (!name)
        throw new ExoplanetError("Provide an exoplanet name");
    const d = await query(`select pl_name,pl_rade,pl_orbper,pl_orbperiod,pl_bmassj,pl_eqt,st_teff,st_rad,discoverymethod,disc_year,pl_pnum from ps where pl_name like '${name.replace(/'/g, "''")}%' and default_flag=1`);
    if (!d?.length)
        return `No exoplanet named ${name}`;
    const p = d[0];
    const lines = [
        `Name: ${p.pl_name}`,
        p.pl_rade ? `Radius: ${p.pl_rade} Earth radii` : "",
        p.pl_orbperiod ? `Orbital period: ${p.pl_orbperiod} days` : "",
        p.pl_bmassj ? `Mass: ${p.pl_bmassj} Jupiter masses` : "",
        p.pl_eqt ? `Equilibrium temperature: ${p.pl_eqt} K` : "",
        p.discoverymethod ? `Discovered by: ${p.discoverymethod}` : "",
        p.disc_year ? `Discovery year: ${p.disc_year}` : "",
        p.st_teff ? `Host star temp: ${p.st_teff} K` : "",
        p.pl_pnum !== undefined ? `Planets in system: ${p.pl_pnum}` : "",
    ].filter(Boolean);
    return lines.join("\n");
}
// ---- muxA tools:
const TAP = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync";
function clamp(value, fallback, max) {
    return Math.max(1, Math.min(Math.round(value ?? fallback), max));
}
function cell(value) {
    if (value == null || value === "")
        return "null";
    if (typeof value === "number")
        return String(Math.round(value * 10000) / 10000);
    return String(value);
}
async function tap(query) {
    const res = await fetch(`${TAP}?query=${encodeURIComponent(query)}&format=json`, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(60000),
    });
    const text = await res.text();
    if (!res.ok || text.trimStart().startsWith("<?xml")) {
        const reason = /ORA-\d+: ([^<]*)/.exec(text)?.[1] ?? text.replace(/\s+/g, " ").slice(0, 220);
        throw new Error(`Exoplanet TAP error: ${reason}`);
    }
    const rows = JSON.parse(text);
    return Array.isArray(rows) ? rows : [];
}
const SAFE = /^[a-zA-Z0-9_.,()'"*=<>!+\- /%]*$/;
export async function hostStars(args) {
    const host = (args.host ?? "").trim();
    if (!host)
        throw new Error("Provide a host star name such as Kepler-186 or TRAPPIST-1.");
    if (!SAFE.test(host) || /['"();]/.test(host))
        throw new Error("That host name contains unsupported characters.");
    const limit = clamp(args.limit, 10, 60);
    const rows = await tap(`select pl_name, pl_letter, pl_orbper, pl_rade, pl_masse, pl_eqt, pl_orbsmax, pl_dens, disc_year, discoverymethod, st_teff, st_rad, st_mass, st_spectype, sy_dist from pscomppars where hostname like '%${host.replace(/'/g, "")}%' top ${limit}`);
    if (!rows.length)
        return `No confirmed planet in the archive orbits a star matching "${host}".`;
    const columns = Object.keys(rows[0]);
    return [
        `Planets around host stars matching "${host}": ${rows.length} confirmed planet(s).`,
        ...rows.map((r, i) => `${i + 1}. ${cell(r.pl_name)} (${cell(r.pl_letter)}) discovered ${cell(r.disc_year)} by ${cell(r.discoverymethod)}`),
        "",
        ...rows.map((r) => columns.map((c) => `${c}=${cell(r[c])}`).join(" | ")),
    ].join("\n");
}
