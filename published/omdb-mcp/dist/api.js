export class OmdbError extends Error {
    constructor(message) {
        super(message);
        this.name = "OmdbError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
const BASE = "https://www.omdbapi.com";
async function req(path, params) {
    void params;
    let res;
    try {
        res = await fetch(BASE + path, { signal: AbortSignal.timeout(30000), headers: { ...UA, Accept: "application/json" } });
    }
    catch (e) {
        throw new OmdbError(`Network error: ${e.message}`);
    }
    if (!res.ok) {
        const body = (await res.text()).slice(0, 300);
        throw new OmdbError(`HTTP ${res.status}: ${body}`);
    }
    return res.text();
}
function key() {
    const k = process.env.OMDB_API_KEY;
    if (!k)
        throw new OmdbError("Set OMDB_API_KEY (free at omdbapi.com/apikey.aspx, 1,000 req/day).");
    return k;
}
function check(text) {
    const d = JSON.parse(text);
    if (d.Response === "False")
        throw new OmdbError(`OMDb: ${String(d.Error ?? "unknown error").slice(0, 200)}`);
    return d;
}
export function searchMovies(query, page) {
    return req(`/?apikey=${encodeURIComponent(key())}&s=${encodeURIComponent(query)}&page=${encodeURIComponent(page ?? "1")}`, {}).then((t) => {
        const d = check(t);
        return JSON.stringify({ totalResults: d.totalResults ?? null, results: d.Search ?? [] }, null, 2);
    });
}
export function getMovie(idOrTitle) {
    const byId = /^(tt\d+)$/.test(idOrTitle.trim());
    const q = byId ? `i=${encodeURIComponent(idOrTitle.trim())}` : `t=${encodeURIComponent(idOrTitle.trim())}`;
    return req(`/?apikey=${encodeURIComponent(key())}&${q}&plot=full`, {}).then((t) => JSON.stringify(check(t), null, 2));
}
// ---- muxG tools:
const OMDB_WIKIDATA_API = "https://www.wikidata.org/w/api.php";
const OMDB_LIST_CAP = 12;
async function omdbWikiJson(params) {
    const qs = new URLSearchParams({ format: "json", formatversion: "2", ...params });
    const res = await fetch(`${OMDB_WIKIDATA_API}?${qs}`, {
        headers: { "User-Agent": "awesome-mcps/1.0 (film metadata)", Accept: "application/json" },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new OmdbError(`Wikidata returned ${res.status}`);
    const d = (await res.json());
    if (d.error)
        throw new OmdbError(`Wikidata: ${d.error.info ?? "request failed"}`);
    return d;
}
function omdbClaimValue(claims, property) {
    return claims[property]?.[0]?.mainsnak?.datavalue?.value;
}
function omdbBound(value, min, max, fallback) {
    const n = Number(value);
    if (!Number.isFinite(n))
        return fallback;
    return Math.max(min, Math.min(Math.floor(n), max));
}
const OMDB_CINEMETA = "https://v3-cinemeta.strem.io/meta";
function omdbClaims(claims, property) {
    return (claims[property] ?? [])
        .map((c) => c.mainsnak?.datavalue?.value)
        .filter((v) => v !== undefined && v !== null);
}
function omdbWikidataYear(value) {
    const m = /^([+-])(\d{4})-(\d{2})-(\d{2})/.exec(String(value?.time ?? ""));
    if (!m)
        return null;
    return { year: `${m[1] === "-" ? "-" : ""}${m[2]}`, date: `${m[2]}-${m[3]}-${m[4]}` };
}
function omdbQuantity(value) {
    const n = Number(String(value?.amount ?? "").replace(/^\+/, ""));
    return Number.isFinite(n) ? n : null;
}
/** The hand-curated facts Wikidata holds for one film, with every Q-id labelled. */
export async function wikidataFacts(args) {
    let qid = String(args.id ?? "").trim().toUpperCase();
    const title = String(args.title ?? "").trim();
    if (qid && !/^Q\d+$/.test(qid))
        throw new OmdbError(`"${qid}" is not a Wikidata Q-id; they look like Q184843.`);
    if (!qid) {
        if (!title)
            throw new OmdbError("Give either a Wikidata id (Q184843) or a title to look up.");
        const search = await omdbWikiJson({ action: "wbsearchentities", search: title, language: "en", uselang: "en", type: "item", limit: "5" });
        const hits = search.search ?? [];
        if (!hits.length)
            throw new OmdbError(`Wikidata has no item matching "${title}".`);
        qid = hits[0].id;
    }
    const data = await omdbWikiJson({ action: "wbgetentities", ids: qid, props: "claims|labels|sitelinks", languages: "en" });
    const entity = data.entities?.[qid];
    if (!entity || entity.missing !== undefined)
        throw new OmdbError(`Wikidata has no entity ${qid} (it may have been merged or deleted).`);
    const claims = entity.claims ?? {};
    const label = entity.labels?.en?.value ?? null;
    const linked = ["P31", "P495", "P364", "P57", "P161", "P272"];
    const qids = new Set();
    const idsOf = (property) => omdbClaims(claims, property)
        .map((v) => (typeof v === "object" && v.id ? String(v.id) : null))
        .filter((v) => v !== null && /^Q\d+$/.test(v));
    for (const property of linked) {
        for (const id of idsOf(property))
            qids.add(id);
    }
    const labels = new Map();
    if (qids.size) {
        const namedEntities = await omdbWikiJson({ action: "wbgetentities", ids: [...qids].join("|"), props: "labels", languages: "en" });
        for (const [id, e] of Object.entries(namedEntities.entities ?? {})) {
            const text = e.labels?.en?.value;
            if (text)
                labels.set(id, String(text));
        }
    }
    const named = (property) => idsOf(property).map((id) => `${labels.get(id) ?? "(no English label)"} (${id})`);
    const release = omdbClaimValue(claims, "P577");
    const when = omdbWikidataYear(release);
    const runtime = omdbClaims(claims, "P2047").map(omdbQuantity).find((n) => n !== null) ?? null;
    const sitelinks = Object.keys(entity.sitelinks ?? {}).length;
    const imdb = omdbClaimValue(claims, "P345");
    const tmdb = omdbClaimValue(claims, "P4983");
    const lines = [
        `${label ? `${label} ` : ""}(${qid})${when ? ` — ${when.year}` : ""}`,
        "",
        `instance of: ${named("P31").join(", ") || "not stated on Wikidata"}`,
        `release date: ${when?.date ?? "not stated"}`,
        `running time: ${runtime !== null ? `${runtime} minute(s)` : "not stated"}`,
        `country: ${named("P495").join(", ") || "not stated"}`,
        `original language: ${named("P364").join(", ") || "not stated"}`,
        `directors: ${named("P57").join(", ") || "not stated"}`,
    ];
    const cast = named("P161");
    lines.push(`credited cast: ${cast.length ? `${cast.slice(0, 12).join(", ")}${cast.length > 12 ? `, and ${cast.length - 12} more` : ""}` : "not stated"}`);
    lines.push(`production company: ${named("P272").join(", ") || "not stated"}`);
    lines.push(`IMDb id: ${typeof imdb === "string" ? imdb : "not stated"}`);
    lines.push(`TMDb id: ${typeof tmdb === "string" ? tmdb : "not stated"}`);
    lines.push(`Wikipedia sitelinks: ${sitelinks}`);
    lines.push("", "Wikidata is crowd-edited and often incomplete: an empty field means nobody has added that statement, not that the fact does not exist.");
    return lines.join("\n");
}
/** Cinemeta's own record for a film, so one provider can be checked against another. */
export async function cinemetaDetails(imdbId) {
    const raw = String(imdbId ?? "").trim();
    const id = /^tt\d+$/.test(raw) ? raw : /^\d+$/.test(raw) ? `tt${raw}` : null;
    if (!id)
        throw new OmdbError(`"${raw}" is not an IMDb id; give tt0083658 or 0083658.`);
    let meta = null;
    let kind = "movie";
    try {
        const res = await fetch(`${OMDB_CINEMETA}/movie/${encodeURIComponent(id)}.json`, {
            headers: { "User-Agent": "awesome-mcps/1.0 (film metadata)", Accept: "application/json" },
            signal: AbortSignal.timeout(25000),
        });
        if (res.ok) {
            const d = (await res.json());
            if (d?.meta)
                meta = d.meta;
        }
    }
    catch (e) {
        throw new OmdbError(`Cinemeta network error: ${e.message}`);
    }
    if (!meta) {
        try {
            const alt = await fetch(`${OMDB_CINEMETA}/series/${encodeURIComponent(id)}.json`, {
                headers: { "User-Agent": "awesome-mcps/1.0 (film metadata)", Accept: "application/json" },
                signal: AbortSignal.timeout(25000),
            });
            if (alt.ok) {
                const d = (await alt.json());
                if (d?.meta) {
                    meta = d.meta;
                    kind = "series";
                }
            }
        }
        catch { /* the movie lookup already reported its own failure */ }
    }
    if (!meta)
        throw new OmdbError(`Cinemeta has no record for ${id}.`);
    const cast = Array.isArray(meta.cast) ? meta.cast : [];
    const genres = Array.isArray(meta.genres) ? meta.genres : typeof meta.genre === "string" ? meta.genre.split(",") : [];
    const director = Array.isArray(meta.director) ? meta.director : typeof meta.director === "string" ? [meta.director] : [];
    const lines = [
        `${meta.name ?? "(untitled)"} (${kind}, ${id})${meta.releaseInfo ? ` — ${meta.releaseInfo}` : ""}`,
        "",
        `${String(meta.description ?? "no synopsis published").replace(/<[^>]+>/g, "").trim().slice(0, 900)}`,
        "",
        `Runtime: ${meta.runtime ?? "not published"}`,
        `Genres: ${genres.map((g) => String(g).trim()).filter(Boolean).join(", ") || "not published"}`,
        `Director: ${director.join(", ") || "not published"}`,
        `Cast: ${cast.length ? `${cast.slice(0, 10).join(", ")}${cast.length > 10 ? `, and ${cast.length - 10} more` : ""}` : "not published"}`,
        `Community IMDb rating: ${meta.imdbRating ?? "not published"}`,
        `Awards: ${meta.awards ?? "not published"}`,
    ];
    lines.push("", "Cinemeta publishes no streaming availability, so which service currently carries this film is not something this tool can answer.");
    lines.push("A second provider is worth reading because OMDb and Cinemeta fill different fields, and where they disagree the source of each value matters.");
    return lines.join("\n");
}
/** Which film did you mean? Wikidata candidates for a title, each with its IMDb id. */
export async function findFilmIds(args) {
    const title = String(args.title ?? "").trim();
    if (!title)
        throw new OmdbError("title is empty, for example \"Blade Runner\".");
    const limit = omdbBound(args.limit, 1, OMDB_LIST_CAP, 6);
    const d = await omdbWikiJson({
        action: "wbsearchentities",
        search: title,
        language: "en",
        uselang: "en",
        type: "item",
        limit: String(limit * 2),
    });
    const hits = d.search ?? [];
    if (!hits.length) {
        return [`No Wikidata item matches "${title}".`, "Wikidata covers most notable films, so an obscure or very recent title may be absent."].join("\n");
    }
    const qids = hits.slice(0, limit).map((h) => h.id);
    const entities = await omdbWikiJson({ action: "wbgetentities", ids: qids.join("|"), props: "claims" });
    const imdbByQid = new Map();
    const yearByQid = new Map();
    for (const [qid, e] of Object.entries(entities.entities ?? {})) {
        const imdb = omdbClaimValue(e.claims ?? {}, "P345");
        if (typeof imdb === "string")
            imdbByQid.set(qid, imdb);
        const published = omdbClaimValue(e.claims ?? {}, "P577");
        const m = /^([+-])(\d{4})/.exec(String(published?.time ?? ""));
        if (m)
            yearByQid.set(qid, `${m[1] === "-" ? "before " : ""}${m[2]}`);
    }
    return [
        `Wikidata candidates for "${title}"`,
        `${hits.length} item(s) found; the first ${Math.min(limit, hits.length)} with their IMDb id where Wikidata has one.`,
        "",
        ...hits.slice(0, limit).map((h) => {
            const imdb = imdbByQid.get(h.id) ?? "no IMDb id on Wikidata";
            const year = yearByQid.get(h.id);
            return [
                `${h.id}${year ? ` (${year})` : ""} ${h.label ?? "(no label)"}`,
                `  ${h.description ?? "no description"}`,
                `  ${imdb}${imdb !== "no IMDb id on Wikidata" ? " -> pass this to cinemeta_details" : ""}${h.match?.type === "alias" ? "  [matched on an alias, not the label]" : ""}`,
            ].join("\n");
        }),
        "",
        "Pick the Q-id whose description matches the film you meant, then pass it to wikidata_facts, or pass the IMDb id to cinemeta_details.",
    ].join("\n");
}
