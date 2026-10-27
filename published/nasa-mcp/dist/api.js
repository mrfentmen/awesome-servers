const m0 = (() => {
    const KEY = process.env.NASA_API_KEY || "DEMO_KEY";
    const BASE = "https://api.nasa.gov";
    class NasaError extends Error {
    }
    async function request(url, retries = 3) {
        for (let attempt = 0;; attempt++) {
            try {
                const res = await fetch(url, { signal: AbortSignal.timeout(25000) });
                if (!res.ok) {
                    if (res.status === 429 && attempt < retries) {
                        const wait = 10000 * (attempt + 1);
                        await new Promise((r) => setTimeout(r, wait));
                        continue;
                    }
                    throw new NasaError(`NASA error ${res.status}${res.status === 429 ? " (rate limit, try again shortly or set NASA_API_KEY)" : ""}`);
                }
                return (await res.json());
            }
            catch (e) {
                if (e instanceof NasaError)
                    throw e;
                if (attempt >= retries)
                    throw e;
                await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
            }
        }
    }
    async function apod(_args) {
        const d = await request(`${BASE}/planetary/apod?api_key=${KEY}`);
        return `# ${d.title ?? "APOD"}\n${d.date ?? ""} | ${d.copyright ?? "public domain"}\n${d.explanation ?? ""}`;
    }
    async function neo(args) {
        const today = new Date().toISOString().slice(0, 10);
        const start = args.start_date || today;
        const end = args.end_date || today;
        const d = await request(`${BASE}/neo/rest/v1/feed?start_date=${start}&end_date=${end}&api_key=${KEY}`);
        const out = [];
        for (const [date, objs] of Object.entries(d.near_earth_objects ?? {})) {
            for (const o of objs.slice(0, 5)) {
                out.push(`${date} | ${o.name ?? ""} | ${(o.estimated_diameter?.kilometers?.estimated_diameter_max ?? 0).toFixed(2)} km | ${o.is_potentially_hazardous_asteroid ? "HAZARDOUS" : "safe"}`);
            }
        }
        return `Near Earth Objects ${start} to ${end}\n${out.join("\n") || "None found"}`;
    }
    async function marsPhotos(args) {
        const rover = args.rover || "curiosity";
        const sol = args.sol ?? 1000;
        const camera = args.camera ? `&camera=${args.camera}` : "";
        const d = await request(`${BASE}/mars-photos/api/v1/rovers/${rover}/photos?sol=${sol}${camera}&api_key=${KEY}`);
        const photos = (d.photos ?? []).slice(0, 12);
        return `Mars ${rover} sol ${sol} photos: ${photos.length}\n${photos.map((p) => `${p.id} | ${p.camera?.full_name ?? ""} | ${p.img_src ?? ""}`).join("\n") || "No photos found"}`;
    }
    return { NasaError, apod, marsPhotos, neo };
})();
const m1 = (() => {
    const KEY = process.env.NASA_API_KEY || "DEMO_KEY";
    const BASE = "https://api.nasa.gov/insight_weather";
    const UA = "mrfentmen-mars-weather-mcp/1.0 (https://github.com/mrfentmen)";
    class MarsError extends Error {
    }
    async function latestWeather(_args) {
        let lastErr;
        for (let attempt = 0; attempt < 4; attempt++) {
            try {
                const res = await fetch(`${BASE}/?api_key=${KEY}&feedtype=json&ver=1.0`, {
                    headers: { "User-Agent": UA },
                    signal: AbortSignal.timeout(30000),
                });
                if (res.status === 429 && attempt < 3) {
                    await new Promise((r) => setTimeout(r, 10000 * (attempt + 1)));
                    continue;
                }
                if (!res.ok) {
                    throw new MarsError(`NASA error ${res.status}${res.status === 429 ? " (rate limit, try later or set NASA_API_KEY)" : ""}`);
                }
                const d = await res.json();
                const sols = d.sol_keys ?? [];
                const last = sols[sols.length - 1];
                if (!last)
                    throw new MarsError("No Mars weather sols returned");
                const s = d[last] ?? {};
                const t = s.AT?.av;
                const p = s.PRE?.av;
                const ws = s.HWS?.av;
                const wd = s.WD?.most_common?.compass_point;
                return `Mars weather, sol ${last} (${s.First_UTC?.slice(0, 10) ?? ""} to ${s.Last_UTC?.slice(0, 10) ?? ""})\nAir temp: ${t ?? "n/a"} C\nPressure: ${p ? (p / 100).toFixed(2) : "n/a"} hPa\nWind speed: ${ws ?? "n/a"} m/s\nWind direction: ${wd ?? "n/a"}`;
            }
            catch (e) {
                lastErr = e;
                if (e instanceof MarsError)
                    throw e;
                if (attempt >= 3)
                    throw lastErr;
                await new Promise((r) => setTimeout(r, 2000));
            }
        }
        throw lastErr;
    }
    return { MarsError, latestWeather };
})();
const m2 = (() => {
    const BASE = 'https://api.nasa.gov/neo/rest/v1/neo/browse';
    async function browse(args = {}) {
        const limit = Math.max(1, Math.min(args.limit ?? 10, 25));
        const res = await fetch(`${BASE}?api_key=DEMO_KEY`, {
            headers: { 'User-Agent': 'mrfentmen-nasa-asteroids-mcp/1.0', Accept: 'application/json' },
            signal: AbortSignal.timeout(25000),
        });
        if (!res.ok)
            throw new Error(`NASA NeoWs returned ${res.status}`);
        const data = (await res.json());
        const rows = data.near_earth_objects ?? [];
        if (!rows.length)
            return 'No near earth objects returned.';
        const shown = rows.slice(0, limit);
        return `Near Earth Objects (${rows.length} loaded, ${shown.length} shown):\n` +
            shown
                .map((a, i) => {
                const size = (a.estimated_diameter ?? {});
                const km = (size.kilometers ?? {});
                const hazard = a.is_potentially_hazardous_asteroid ? 'hazardous' : 'safe';
                const name = a.name ?? 'unnamed';
                const diameter = km?.estimated_diameter_max ? `${Number(km.estimated_diameter_max).toFixed(1)} km` : '';
                return `${i + 1}. ${name} | ${hazard}${diameter ? ` | ${diameter} max` : ''}`;
            })
                .join('\n');
    }
    return { browse };
})();
const m3 = (() => {
    const BASE = 'https://api.nasa.gov/mars-photos/api/v1/rovers';
    async function photos(args = {}) {
        const rover = (args.rover ?? 'curiosity').trim().toLowerCase();
        const sol = args.sol ?? 1000;
        const limit = Math.max(1, Math.min(args.limit ?? 10, 25));
        const url = `${BASE}/${encodeURIComponent(rover)}/photos?sol=${sol}&page=1&api_key=DEMO_KEY`;
        const res = await fetch(url, {
            headers: { 'User-Agent': 'mrfentmen-nasa-mars-photos-mcp/1.0', Accept: 'application/json' },
            signal: AbortSignal.timeout(25000),
        });
        if (!res.ok)
            throw new Error(`NASA Mars Photos returned ${res.status}`);
        const data = (await res.json());
        const rows = (data.photos ?? []).slice(0, limit);
        if (!rows.length)
            return `No ${rover} photos for sol ${sol}.`;
        return `${rover} rover photos, sol ${sol} (${rows.length} shown):\n` +
            rows
                .map((p, i) => {
                const camera = (p.camera ?? {});
                return `${i + 1}. ${p.id ?? 'unknown'} | ${camera.full_name ?? camera.name ?? ''} | ${p.img_src ?? ''}`;
            })
                .join('\n');
    }
    return { photos };
})();
const m4 = (() => {
    const BASE = 'https://api.nasa.gov/techport/api/projects';
    async function project(args) {
        const id = Number(args.id);
        if (!Number.isInteger(id) || id <= 0)
            return 'Provide a positive TechPort project ID.';
        const res = await fetch(`${BASE}/${id}?api_key=DEMO_KEY`, {
            headers: { 'User-Agent': 'mrfentmen-nasa-techport-mcp/1.0', Accept: 'application/json' },
            signal: AbortSignal.timeout(25000),
        });
        if (!res.ok)
            throw new Error(`NASA TechPort returned ${res.status}`);
        const data = (await res.json());
        const p = data.project;
        if (!p?.title)
            return `No TechPort project found with id ${id}.`;
        const lines = [
            `Title: ${p.title}`,
            `Status: ${p.status ?? 'n/a'}`,
            `Start: ${p.startDateString ?? 'n/a'}`,
            `End: ${p.endDateString ?? 'n/a'}`,
        ];
        const pis = (p.principalInvestigators ?? []).map((pi) => pi.fullName).filter(Boolean).join(', ');
        if (pis)
            lines.push(`Principal investigators: ${pis}`);
        if (p.description)
            lines.push(`\n${p.description.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 400)}`);
        if (p.website)
            lines.push(`\nWebsite: ${p.website}`);
        return lines.join('\n');
    }
    return { project };
})();
export const MarsError = m1.MarsError;
export const NasaError = m0.NasaError;
export const apod = m0.apod;
export const browse = m2.browse;
export const latestWeather = m1.latestWeather;
export const marsPhotos = m0.marsPhotos;
export const neo = m0.neo;
export const photos = m3.photos;
export const project = m4.project;
export const m0_neo = m0.neo;
export const m0_NasaError = m0.NasaError;
export const m0_apod = m0.apod;
export const m0_marsPhotos = m0.marsPhotos;
export const m1_MarsError = m1.MarsError;
export const m1_latestWeather = m1.latestWeather;
export const m2_browse = m2.browse;
export const m3_photos = m3.photos;
export const m4_project = m4.project;
const m5 = (() => {
    const KEY = process.env.NASA_API_KEY || "DEMO_KEY";
    const BASE = "https://api.nasa.gov";
    class Nasa5Error extends Error {
    }
    async function getJson(path) {
        const res = await fetch(`${BASE}${path}${path.includes("?") ? "&" : "?"}api_key=${KEY}`, {
            signal: AbortSignal.timeout(25000),
        });
        if (!res.ok)
            throw new Nasa5Error(`NASA error ${res.status}`);
        return res.json();
    }
    async function neoLookup(args) {
        const id = (args.id ?? "").trim();
        if (!id)
            return "Provide a NEO id.";
        const d = await getJson(`/neo/rest/v1/neo/${encodeURIComponent(id)}`);
        const approaches = (d.close_approach_data ?? []).slice(0, 3).map((c) => `${String(c.close_approach_date ?? "?").slice(0, 10)} miss ${(Number(c.miss_distance?.lunar ?? 0)).toFixed(1)} LD ${c.orbiting_body ?? ""}`);
        return `${d.name ?? id} | H=${d.absolute_magnitude_h ?? "?"} | ${(d.estimated_diameter?.kilometers?.estimated_diameter_max ?? 0).toFixed(2)} km max | ${d.is_potentially_hazardous_asteroid ? "HAZARDOUS" : "safe"}\nClose approaches:\n${approaches.join("\n") || "none listed"}`;
    }
    async function epicImages(args) {
        const limit = Math.min(Math.max(Number(args.limit ?? 5) || 5, 1), 20);
        const d = await getJson("/EPIC/api/natural");
        const rows = (Array.isArray(d) ? d : []).slice(0, limit);
        if (!rows.length)
            return "No EPIC images returned.";
        return rows.map((e, i) => `${i + 1}. ${e.identifier ?? "?"} (${String(e.date ?? "").slice(0, 10)})\n   ${(e.caption ?? "").slice(0, 160)}`).join("\n");
    }
    async function apodDated(args) {
        const date = (args.date ?? "").trim();
        const d = await getJson(date ? `/planetary/apod?date=${encodeURIComponent(date)}` : "/planetary/apod");
        return `# ${d.title ?? "APOD"}\n${d.date ?? ""} | ${d.copyright ?? "public domain"}\n${d.media_type === "video" ? `Video: ${d.url ?? ""}\n` : ""}${d.explanation ?? ""}`;
    }
    async function earthAssets(args) {
        const lat = Number(args.lat), lon = Number(args.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lon))
            return "Provide valid lat and lon.";
        const date = (args.date ?? "").trim() || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
        const d = await getJson(`/planetary/earth/assets?lon=${lon}&lat=${lat}&date=${encodeURIComponent(date)}&dim=0.1`);
        return `Landsat passes over ${lat},${lon} near ${date}:\n${JSON.stringify(d).slice(0, 1200)}`;
    }
    async function techPatents(args) {
        const q = (args.query ?? "").trim();
        if (!q)
            return "Provide search terms.";
        const limit = Math.min(Math.max(Number(args.limit ?? 5) || 5, 1), 20);
        const res = await fetch(`https://technology.nasa.gov/api/api/patent/${encodeURIComponent(q)}`, {
            signal: AbortSignal.timeout(25000),
        });
        if (!res.ok)
            throw new Nasa5Error(`NASA TechTransfer error ${res.status}`);
        const d = (await res.json());
        const rows = (d.results ?? []).slice(0, limit);
        if (!rows.length)
            return `No NASA patents for "${q}".`;
        return rows.map((r, i) => `${i + 1}. ${r[1] ?? ""} [${r[2] ?? ""}]\n   ${(r[0] ?? "").replace(/<[^>]+>/g, "").slice(0, 160)}`).join("\n");
    }
    return { Nasa5Error, neoLookup, epicImages, apodDated, earthAssets, techPatents };
})();
export const Nasa5Error = m5.Nasa5Error;
export const neoLookup = m5.neoLookup;
export const epicImages = m5.epicImages;
export const apodDated = m5.apodDated;
export const earthAssets = m5.earthAssets;
export const techPatents = m5.techPatents;
