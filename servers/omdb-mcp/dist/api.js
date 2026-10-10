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
const OMDB_CINEMETA_URL = "https://v3-cinemeta.strem.io/meta/movie";
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
async function omdbWikiLabels(ids) {
    const wanted = [...new Set(ids.filter(Boolean))].slice(0, OMDB_LIST_CAP * 2);
    if (!wanted.length)
        return new Map();
    try {
        const d = await omdbWikiJson({
            action: "wbgetentities",
            ids: wanted.join("|"),
            props: "labels",
            languages: "en",
        });
        const out = new Map();
        for (const [id, e] of Object.entries(d.entities ?? {})) {
            const label = e.labels?.en?.value;
            out.set(id, label ?? "not reported");
        }
        return out;
    }
    catch {
        return new Map();
    }
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
/** The community-curated facts Wikidata holds for a film, with the sources it names. */
export async function wikidataFacts(args) {
    let qid = String(args.id ?? "").trim().toUpperCase();
    const title = String(args.title ?? "").trim();
    if (!qid && !title)
        throw new OmdbError("Give a Wikidata Q-id such as Q184843, or a title to search for first.");
    if (!qid) {
        const d = await omdbWikiJson({
            action: "wbsearchentities",
            search: title,
            language: "en",
            uselang: "en",
            type: "item",
            limit: "1",
        });
        const hit = d.search?.[0];
        if (!hit)
            throw new OmdbError(`Wikidata has no item for "${title}".`);
        qid = hit.id;
    }
    if (!/^Q\d+$/.test(qid))
        throw new OmdbError(`"${qid}" is not a Wikidata Q-id, which looks like Q followed by digits.`);
    const d = await omdbWikiJson({ action: "wbgetentities", ids: qid, props: "labels|descriptions|claims|sitelinks" });
    const e = d.entities?.[qid];
    if (!e)
        throw new OmdbError(`Wikidata has no item ${qid}.`);
    const claims = e.claims ?? {};
    const enLabel = e.labels?.en?.value ?? "not reported";
    const itemIds = [];
    const collectItems = (p) => {
        return (claims[p] ?? []).map((c) => {
            const v = c.mainsnak?.datavalue?.value;
            if (v?.id)
                itemIds.push(v.id);
            return v?.id ?? "";
        }).filter(Boolean);
    };
    const directors = collectItems("P57");
    const cast = collectItems("P161");
    const production = collectItems("P272");
    const country = collectItems("P495");
    const language = collectItems("P364");
    const instance = collectItems("P31");
    const labels = await omdbWikiLabels([...directors, ...cast, ...production, ...country, ...language, ...instance]);
    const published = omdbClaimValue(claims, "P577");
    const runtime = omdbClaimValue(claims, "P2047");
    const imdb = omdbClaimValue(claims, "P345");
    const tmdb = omdbClaimValue(claims, "P4947");
    const nameList = (ids, cap) => ids.slice(0, cap).map((id) => `${labels.get(id) ?? "not reported"} (${id})`);
    return [
        `Wikidata ${qid}: ${enLabel}`,
        e.descriptions?.en?.value ? `Description: ${e.descriptions.en.value}` : "",
        `Instance of: ${nameList(instance, 3).join(", ") || "not reported"}`,
        `Release date: ${published?.time ? published.time.replace(/^\+/, "").replace(/T.*$/, "") : "not reported"}`,
        `Running time: ${runtime?.amount ? `${Number(runtime.amount)} minutes` : "not reported"}`,
        `Country: ${nameList(country, 3).join(", ") || "not reported"}`,
        `Original language: ${nameList(language, 3).join(", ") || "not reported"}`,
        `IMDb id: ${typeof imdb === "string" ? imdb : "not reported"}`,
        `TMDb id: ${typeof tmdb === "string" ? tmdb : "not reported"}`,
        `Directors: ${nameList(directors, 4).join(", ") || "not reported"}`,
        `Cast (${cast.length} credited on Wikidata, first ${Math.min(6, cast.length)}): ${nameList(cast, 6).join(", ") || "not reported"}`,
        `Production company: ${nameList(production, 3).join(", ") || "not reported"}`,
        `Wikipedia sitelinks: ${Object.keys(e.sitelinks ?? {}).length}`,
        "",
        "Wikidata is edited by hand, so a missing fact usually means nobody has added it yet rather than that the fact is false. Dates carry a precision: a year-only value is stored as 2026-00-00T00:00:00Z.",
    ].filter(Boolean).join("\n");
}
/** A second provider's view of the same film, including where it can be streamed. */
export async function cinemetaDetails(args) {
    const raw = String(args.imdb_id ?? "").trim();
    const imdb = raw.toLowerCase().startsWith("tt") ? raw.toLowerCase() : `tt${raw.replace(/^\D+/, "")}`;
    if (!/^tt\d{5,9}$/.test(imdb)) {
        throw new OmdbError(`"${raw}" is not an IMDb id, which looks like tt followed by digits, for example tt0083658.`);
    }
    const res = await fetch(`${OMDB_CINEMETA_URL}/${encodeURIComponent(imdb)}.json`, {
        headers: { "User-Agent": "awesome-mcps/1.0 (film metadata)", Accept: "application/json" },
        signal: AbortSignal.timeout(25000),
    });
    if (res.status === 404)
        throw new OmdbError(`Cinemeta has no entry for ${imdb}.`);
    if (!res.ok)
        throw new OmdbError(`Cinemeta returned ${res.status}`);
    const d = (await res.json());
    const m = d.meta;
    if (!m)
        throw new OmdbError(`Cinemeta returned no metadata for ${imdb}.`);
    const streams = Object.entries(d.streams ?? {});
    const awards = String(m.awards ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    return [
        `Cinemeta for ${imdb}: ${m.name ?? "not reported"}${m.year ? ` (${m.year})` : ""}`,
        m.description ? `Synopsis: ${String(m.description).replace(/<[^>]+>/g, "").trim()}` : "",
        `Runtime: ${m.runtime ?? "not reported"}`,
        `Genres: ${m.genres?.length ? m.genres.join(", ") : "not reported"}`,
        `Country: ${m.country ?? "not reported"}`,
        `Director: ${m.director?.length ? m.director.join(", ") : "not reported"}`,
        `Cast (${m.cast?.length ?? 0} listed, first ${Math.min(8, m.cast?.length ?? 0)}): ${m.cast?.slice(0, 8).join(", ") ?? "not reported"}`,
        `Community IMDb rating: ${m.imdbRating ?? "not reported"}`,
        `DVD release: ${m.dvdRelease ?? "not reported"}`,
        awards ? `Awards: ${awards.slice(0, 300)}` : "",
        m.links?.wikidata ? `Wikidata: ${m.links.wikidata}` : "",
        "",
        streams.length
            ? `Where to stream it (${streams.length} source(s)): ${streams.map(([k, v]) => `${k}: ${v.map((x) => x.title ?? x.name ?? "?").slice(0, 3).join(" / ")}`).join("; ").slice(0, 400)}`
            : "No streaming source is listed for this title right now.",
        "",
        "Cinemeta aggregates community and open data, so its numbers can differ from OMDb's; treat a disagreement as a signal to check both rather than picking one.",
    ].filter(Boolean).join("\n");
}
