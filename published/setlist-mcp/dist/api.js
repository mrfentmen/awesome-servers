/**
 * Minimal Setlist.fm REST API v1.0 client.
 *
 * Docs: https://api.setlist.fm/docs/1.0/index.html
 * Requires a free API key (https://www.setlist.fm/settings/api) in the
 * SETLISTFM_API_KEY env var.
 */
const BASE = "https://api.setlist.fm/rest/1.0";
export class SetlistApiError extends Error {
}
function apiKey() {
    const key = process.env.SETLISTFM_API_KEY;
    if (!key) {
        throw new SetlistApiError("SETLISTFM_API_KEY env var is missing. Get a free key at " +
            "https://www.setlist.fm/settings/api and export it before " +
            "starting this server.");
    }
    return key;
}
async function get(path) {
    const key = apiKey();
    const res = await fetch(`${BASE}${path}`, {
        headers: {
            Accept: "application/json",
            "x-api-key": key,
        },
    });
    if (!res.ok) {
        throw new SetlistApiError(`Setlist.fm API error ${res.status}: ${res.statusText}`);
    }
    return (await res.json());
}
export async function searchArtists(name) {
    const data = await get(`/search/artists?artistName=${encodeURIComponent(name)}&p=1&sort=sortName`);
    return data.artist ?? [];
}
export async function getArtistByMbid(mbid) {
    return await get(`/artist/${mbid}`);
}
export async function getSetlists(artistMbid, page = 1, year) {
    const yearParam = year ? `&year=${year}` : "";
    return await get(`/artist/${artistMbid}/setlists?p=${page}${yearParam}`);
}
export async function getSetlist(id) {
    return await get(`/setlist/${id}`);
}
/** Search setlists containing a specific song, used to count live plays. */
export async function searchSetlistsBySong(artistMbid, songName, page = 1) {
    return await get(`/search/setlists?artistMbid=${artistMbid}&songName=${encodeURIComponent(songName)}&p=${page}`);
}
export function formatSetlist(s) {
    const city = s.venue?.city
        ? `${s.venue.city.name}${s.venue.city.country ? ", " + s.venue.city.country.name : ""}`
        : "unknown city";
    const venue = s.venue?.name ?? "unknown venue";
    const tour = s.tour ? ` (${s.tour.name} tour)` : "";
    const songs = s.sets?.set
        ?.flatMap((set) => set.song)
        .map((song, i) => `${i + 1}. ${song.name}${song.info ? ` [${song.info}]` : ""}`)
        .join("\n") ?? "no setlist data";
    return (`Setlist ${s.id} — ${s.eventDate} @ ${venue}, ${city}${tour}\n` +
        `URL: ${s.url}\n${songs}`);
}
// ---- muxE tools:
// All four existing tools are remote fetches that print what Setlist.fm
// returns: a name, a date, a venue, or a numbered list of songs. Once a setlist
// is in hand, none of them says anything about it. These three read setlist
// data the caller already has and derive what cannot be read off the raw print:
// the structure of one show, what changed between two, and what a run of shows
// adds up to. They make no network call, so they work with or without an API key.
// This block is spliced into api.ts, which does not otherwise import zod, so the
// schemas below carry their own import.
import { z } from "zod";
const Info = z.object({
    name: z.string(),
    info: z.string().optional(),
    cover: z.object({ name: z.string().optional() }).passthrough().optional(),
}).passthrough();
const Part = z.object({
    name: z.string().optional(),
    song: z.array(Info).optional(),
}).passthrough();
const Show = z.object({
    id: z.string().optional(),
    eventDate: z.string().optional(),
    url: z.string().optional(),
    tour: z.object({ name: z.string().optional() }).passthrough().optional(),
    venue: z
        .object({
        name: z.string().optional(),
        city: z
            .object({
            name: z.string().optional(),
            country: z.object({ name: z.string().optional() }).passthrough().optional(),
        })
            .passthrough()
            .optional(),
    })
        .passthrough()
        .optional(),
    sets: z.object({ set: z.array(Part).optional() }).passthrough().optional(),
}).passthrough();
// Setlist.fm writes encore, encore 1, encore 2 and "pre encore" into the part
// name, and a handful of other spellings, so the decision is made on the lower
// cased part name containing the word rather than on an equality test.
const isEncore = (name) => /encore/i.test(name ?? "");
// Songs the band never plays, so a count of appearances would be meaningless.
const normalize = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const parts = (show) => (show.sets?.set ?? []).filter((p) => Array.isArray(p.song) && p.song.length > 0);
const songs = (show) => parts(show).flatMap((part) => (part.song ?? []).map((song, i) => ({ ...song, part: part.name ?? "", position: i + 1 })));
const where = (show) => {
    const bits = [];
    if (show.eventDate)
        bits.push(show.eventDate);
    if (show.venue?.name)
        bits.push(show.venue.name);
    const city = show.venue?.city;
    if (city?.name)
        bits.push(city.country?.name ? `${city.name}, ${city.country.name}` : city.name);
    if (show.tour?.name)
        bits.push(`on the ${show.tour.name.replace(/\s*tour\s*$/i, "")} tour`);
    return bits.join(" @ ");
};
// The info field is free text, so the words that actually mark a song's role
// are counted by name rather than by trying to classify the sentence.
const ROLES = [
    [/\boutro\b/i, "outro"],
    [/\bsecret\b/i, "secret"],
    [/\bteaser\b/i, "teaser"],
    [/\bpre[- ]?encore\b/i, "pre-encore"],
    // Setlist.fm records an encore twice, on the part name and again in the
    // song's own info field, so a note that only says Encore is not a mystery.
    [/\bencore\b/i, "encore"],
    [/\bmedley\b/i, "medley"],
    [/\bcover\b/i, "cover"],
];
// Comparisons run on a normalized key so that punctuation and case do not make
// two spellings of one song look like a drop and an add, but the key is lower
// case and stripped, so it must never be the string that gets printed.
const displayNames = (...shows) => {
    const counts = new Map();
    for (const show of shows) {
        for (const song of songs(show)) {
            const key = normalize(song.name);
            if (!key)
                continue;
            const inner = counts.get(key) ?? new Map();
            inner.set(song.name, (inner.get(song.name) ?? 0) + 1);
            counts.set(key, inner);
        }
    }
    const out = new Map();
    for (const [key, inner] of counts) {
        const best = [...inner.entries()].sort((x, y) => y[1] - x[1])[0];
        out.set(key, best?.[0] ?? key);
    }
    return out;
};
const role = (info) => {
    if (!info)
        return null;
    for (const [re, name] of ROLES)
        if (re.test(info))
            return name;
    return "other note";
};
const parseDate = (raw) => {
    const d = (raw ?? "").trim();
    let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d);
    if (m)
        return { year: m[1], key: `${m[1]}-${m[2]}-${m[3]}` };
    m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(d);
    if (m)
        return { year: m[3], key: `${m[3]}-${m[2]}-${m[1]}` };
    m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(d);
    if (m)
        return { year: m[3], key: `${m[3]}-${m[2]}-${m[1]}` };
    return null;
};
export function analyze_setlist(args) {
    const show = args?.setlist;
    if (!show || typeof show !== "object") {
        return "Pass one setlist object, the JSON that get_setlist_detail prints or the API returns.";
    }
    const list = songs(show);
    const ps = parts(show);
    const head = `What one show adds up to, from its setlist object:`;
    if (!list.length) {
        return [
            head,
            `  ${where(show) || "this show"} has no song data at all in the object you passed.`,
            "  A setlist object with an empty sets.set, or one missing entirely, means either that nobody has entered the show or that the object came from a list endpoint, which returns dates and venues but not songs.",
        ].join("\n");
    }
    const lines = [head, `  ${where(show) || "date and venue not given"}`];
    lines.push(`  total songs: ${list.length} across ${ps.length} ${ps.length === 1 ? "part" : "part(s)"}`);
    ps.forEach((part, i) => {
        const n = (part.song ?? []).length;
        const enc = isEncore(part.name);
        lines.push(`    part ${i + 1}${part.name ? `, named "${part.name}"` : ", unnamed"}${enc ? ", which is an encore" : ""}: ${n} song${n === 1 ? "" : "s"}`);
    });
    const encores = ps.filter((p) => isEncore(p.name));
    if (encores.length) {
        const firstEncoreAt = list.findIndex((s) => isEncore(s.part)) + 1;
        lines.push(`  the first encore starts at song ${firstEncoreAt} of ${list.length}, so ${firstEncoreAt - 1} songs played before the band came back.`);
        if (encores.length > 1) {
            const encoreSizes = encores.map((p) => (p.song ?? []).length);
            lines.push(`  ${encores.length} encore parts, sized ${encoreSizes.join(" then ")}, which is the escalating shape a long show usually has.`);
        }
        else {
            const encoreSize = (encores[0].song ?? []).length;
            lines.push(`  a single encore of ${encoreSize} song${encoreSize === 1 ? "" : "s"}, ${((encoreSize / list.length) * 100).toFixed(0)}% of the show.`);
        }
    }
    else {
        lines.push("  no part is named as an encore, so either the show had none or the source did not record one.");
    }
    const covers = list.filter((s) => s.cover?.name);
    if (covers.length) {
        const byArtist = new Map();
        for (const c of covers) {
            const k = c.cover?.name ?? "unknown";
            byArtist.set(k, (byArtist.get(k) ?? 0) + 1);
        }
        lines.push(`  covers: ${covers.length} of ${list.length} songs (${((covers.length / list.length) * 100).toFixed(0)}%), by ${[...byArtist.entries()].map(([a, n]) => `${a} (${n})`).join(", ")}`);
    }
    else {
        lines.push("  no cover is credited on any song.");
    }
    const noted = list.filter((s) => s.info);
    if (noted.length) {
        const counts = new Map();
        for (const s of noted) {
            const r = role(s.info) ?? "other note";
            counts.set(r, (counts.get(r) ?? 0) + 1);
        }
        lines.push(`  ${noted.length} song${noted.length === 1 ? " carries" : "s carry"} a note, and those notes mark: ${[...counts.entries()].map(([r, n]) => `${n} ${r}`).join(", ")}`);
        const outros = noted.filter((s) => /\boutro\b/i.test(s.info ?? ""));
        if (outros.length) {
            const positions = outros.map((s) => s.position).sort((a, b) => a - b);
            lines.push(`  the closing song${outros.length === 1 ? " is" : "s are"} at position${outros.length === 1 ? "" : "s"} ${positions.join(" and ")} of ${list.length}, which is how a fan tells a planned ending from one that ran long.`);
        }
    }
    else {
        lines.push("  no song carries an info note, so encores, outros and secrets cannot be distinguished from the object alone.");
    }
    // A whole-show count is the thing setlist.fan visitors argue about, so it is
    // placed against the range a rock show usually falls in rather than asserted.
    const n = list.length;
    if (n < 8)
        lines.push(`  ${n} songs is a very short show, shorter than most billed tours run.`);
    else if (n <= 16)
        lines.push(`  ${n} songs is a short set, more like a support slot or a festival early slot than a headline night.`);
    else if (n <= 26)
        lines.push(`  ${n} songs sits inside the usual 18 to 26 range for a headline set.`);
    else if (n <= 40)
        lines.push(`  ${n} songs is a long set, the sort of thing an encore and a festival curfew decide.`);
    else
        lines.push(`  ${n} songs is an unusually long set, so a count this high is worth checking against the source.`);
    const unique = new Set(list.map((s) => normalize(s.name)));
    if (unique.size !== n) {
        const dupes = [];
        const seen = new Map();
        for (const s of list) {
            const k = normalize(s.name);
            seen.set(k, (seen.get(k) ?? 0) + 1);
        }
        for (const [k, c] of seen)
            if (c > 1)
                dupes.push(`${c} x ${k}`);
        lines.push(`  ${dupes.length} song${dupes.length === 1 ? " appears" : "s appear"} more than once in the running order, which happens on a deliberately jokey set: ${dupes.join("; ")}`);
    }
    else {
        lines.push("  no song is played twice in this running order.");
    }
    return lines.join("\n");
}
export function compare_setlists(args) {
    const a = args?.before;
    const b = args?.after;
    if (!a || !b || typeof a !== "object" || typeof b !== "object") {
        return "Pass two setlist objects, for instance the earlier show in before and the later one in after.";
    }
    const la = songs(a);
    const lb = songs(b);
    const lines = [
        "What changed between two shows, from their setlist objects:",
        `  before: ${where(a) || "not described"} — ${la.length} song${la.length === 1 ? "" : "s"}`,
        `  after:  ${where(b) || "not described"} — ${lb.length} song${lb.length === 1 ? "" : "s"}`,
    ];
    if (!la.length || !lb.length) {
        lines.push("  at least one of the two objects carries no songs, so there is nothing to compare.");
        return lines.join("\n");
    }
    const beforeOrder = la.map((s) => normalize(s.name));
    const afterOrder = lb.map((s) => normalize(s.name));
    const label = displayNames(a, b);
    const show2 = (key) => label.get(key) ?? key;
    const beforeSet = new Set(beforeOrder);
    const afterSet = new Set(afterOrder);
    const dropped = [...beforeSet].filter((k) => !afterSet.has(k));
    const added = [...afterSet].filter((k) => !beforeSet.has(k));
    const kept = [...afterSet].filter((k) => beforeSet.has(k));
    lines.push(`  ${kept.length} song${kept.length === 1 ? "" : "s"} in both, ${dropped.length} dropped, ${added.length} added.`);
    if (dropped.length)
        lines.push(`  dropped: ${dropped.map(show2).join(", ")}`);
    if (added.length)
        lines.push(`  added: ${added.map(show2).join(", ")}`);
    if (!dropped.length && !added.length) {
        lines.push("  the two running orders contain the same songs, so this is a reordering rather than a change of material.");
    }
    // Rotation is the thing a setlist comparison is usually for: the same pool
    // rearranged on a given night, which is what distinguishes a fixed set from
    // a rotating one.
    const pa = parts(a);
    const pb = parts(b);
    const ea = pa.filter((p) => isEncore(p.name));
    const eb = pb.filter((p) => isEncore(p.name));
    const aFirst = la.findIndex((s) => isEncore(s.part)) + 1;
    const bFirst = lb.findIndex((s) => isEncore(s.part)) + 1;
    if (aFirst && bFirst) {
        const shift = bFirst - aFirst;
        lines.push(`  the encore moved from song ${aFirst} to song ${bFirst}, a shift of ${shift > 0 ? `${shift} later` : shift < 0 ? `${-shift} earlier` : "none"}.`);
    }
    else if (aFirst || bFirst) {
        lines.push(`  one of the two shows has a part named as an encore and the other has none, so an encore was added or dropped between them.`);
    }
    else {
        lines.push("  neither show records an encore, so their part structure cannot be compared on that point.");
    }
    lines.push(`  parts: ${pa.length} before, ${pb.length} after${pa.length !== pb.length ? ", so the shape of the set changed as well as its content." : "."}`);
    if (kept.length > 2) {
        // For songs present in both, report where they actually moved.
        const moved = [];
        for (const k of kept) {
            const from = beforeOrder.indexOf(k) + 1;
            const to = afterOrder.indexOf(k) + 1;
            if (from !== to)
                moved.push(`${show2(k)} ${from}->${to}`);
        }
        lines.push(moved.length
            ? `  ${moved.length} of the ${kept.length} shared song${moved.length === 1 ? "" : "s"} changed position: ${moved.join(", ")}`
            : `  all ${kept.length} shared songs kept their exact position, so the set was not reshuffled.`);
    }
    const ca = la.filter((s) => s.cover?.name).length;
    const cb = lb.filter((s) => s.cover?.name).length;
    if (ca !== cb)
        lines.push(`  credited covers went from ${ca} to ${cb}.`);
    return lines.join("\n");
}
export function tour_summary(args) {
    const list = args?.setlists;
    if (!Array.isArray(list) || !list.length) {
        return "Pass an array of setlist objects, for instance the objects behind several get_artist_setlists rows.";
    }
    const withSongs = list.filter((s) => s && typeof s === "object" && songs(s).length);
    const lines = [
        "What a run of shows adds up to, from a list of setlist objects:",
        `  shows passed: ${list.length}, of which ${withSongs.length} ${withSongs.length === 1 ? "carries" : "carry"} song data.`,
    ];
    if (!withSongs.length) {
        lines.push("  none of them has any songs, which is what the artist setlists endpoint returns, so there is nothing to aggregate yet.");
        return lines.join("\n");
    }
    const parsed = list
        .map((s) => ({ raw: s.eventDate, parsed: typeof s.eventDate === "string" ? parseDate(s.eventDate) : null }))
        .filter((d) => d.parsed !== null)
        .sort((a, b) => a.parsed.key.localeCompare(b.parsed.key));
    if (parsed.length) {
        lines.push(`  dates run ${parsed[0].raw} to ${parsed[parsed.length - 1].raw}, sorted earliest first.`);
        const years = new Map();
        for (const d of parsed)
            years.set(d.parsed.year, (years.get(d.parsed.year) ?? 0) + 1);
        if (years.size > 1)
            lines.push(`  by year: ${[...years.entries()].sort().map(([y, n]) => `${y}: ${n}`).join(", ")}`);
    }
    else if (list.some((s) => typeof s.eventDate === "string" && s.eventDate)) {
        lines.push("  no eventDate could be read as a date, so the window below is not given a range.");
    }
    const venues = new Map();
    const countries = new Map();
    const cities = new Map();
    for (const s of list) {
        const v = s.venue?.name;
        if (v)
            venues.set(v, (venues.get(v) ?? 0) + 1);
        const c = s.venue?.city;
        if (c?.name)
            cities.set(c.name, (cities.get(c.name) ?? 0) + 1);
        const country = c?.country?.name;
        if (country)
            countries.set(country, (countries.get(country) ?? 0) + 1);
    }
    if (venues.size) {
        const top = [...venues.entries()].sort((x, y) => y[1] - x[1]);
        lines.push(`  ${venues.size} distinct venue${venues.size === 1 ? "" : "s"}; most visited: ${top.slice(0, 5).map(([v, n]) => `${v} (${n})`).join(", ")}`);
    }
    if (cities.size)
        lines.push(`  ${cities.size} distinct cit${cities.size === 1 ? "y" : "ies"}: ${[...cities.entries()].sort((x, y) => y[1] - x[1]).slice(0, 6).map(([c, n]) => `${c} (${n})`).join(", ")}`);
    if (countries.size) {
        const perCountry = [...countries.entries()].sort((x, y) => y[1] - x[1]);
        lines.push(`  ${countries.size} countr${countries.size === 1 ? "y" : "ies"}: ${perCountry.map(([c, n]) => `${c} (${n})`).join(", ")}`);
    }
    // Appearances are counted over the shows that actually have songs, so a
    // partial list of setlists cannot inflate a song into a staple.
    const appearances = new Map();
    for (const s of withSongs) {
        const seenHere = new Set();
        for (const song of songs(s)) {
            const k = normalize(song.name);
            if (!k)
                continue;
            const cur = appearances.get(k) ?? { label: song.name, shows: 0, total: 0, covers: new Set() };
            cur.total += 1;
            if (song.cover?.name)
                cur.covers.add(song.cover.name);
            if (!seenHere.has(k)) {
                cur.shows += 1;
                seenHere.add(k);
            }
            appearances.set(k, cur);
        }
    }
    const rank = [...appearances.values()].sort((x, y) => y.shows - x.shows || y.total - x.total);
    lines.push(`  ${rank.length} distinct song${rank.length === 1 ? "" : "s"} across these shows.`);
    const staples = rank.filter((r) => r.shows === withSongs.length);
    if (staples.length) {
        lines.push(`  played in every one of the ${withSongs.length} show${withSongs.length === 1 ? "" : "s"}, so on this evidence ${staples.length === 1 ? "it is" : "they are"} the fixed part of the set: ${staples.map((r) => r.label).join(", ")}`);
    }
    else {
        lines.push("  no song appears in every one of these shows, so the set is rotating rather than fixed across this window.");
    }
    lines.push("  most played:");
    for (const r of rank.slice(0, 12)) {
        const coverNote = r.covers.size ? `, usually as a ${[...r.covers].join(" and ")} cover` : "";
        lines.push(`    ${String(r.shows).padStart(3)} of ${withSongs.length} shows, ${String(r.total).padStart(3)} times total — ${r.label}${coverNote}`);
    }
    const once = rank.filter((r) => r.shows === 1);
    if (once.length) {
        lines.push(`  ${once.length} song${once.length === 1 ? " was" : "s were"} played exactly once in this window: ${once.slice(0, 15).map((r) => r.label).join(", ")}${once.length > 15 ? `, and ${once.length - 15} more` : ""}`);
    }
    const coverSongs = rank.filter((r) => r.covers.size);
    if (coverSongs.length) {
        const byArtist = new Map();
        for (const r of coverSongs)
            for (const a of r.covers)
                byArtist.set(a, (byArtist.get(a) ?? 0) + r.total);
        lines.push(`  covers in the set: ${[...byArtist.entries()].sort((x, y) => y[1] - x[1]).map(([a, n]) => `${a} (${n} plays)`).join(", ")}`);
    }
    const encoreShows = withSongs.filter((s) => parts(s).some((p) => isEncore(p.name))).length;
    lines.push(`  ${encoreShows} of ${withSongs.length} show${encoreShows === 1 ? "" : "s"} record an encore.`);
    const sizes = withSongs.map((s) => songs(s).length);
    if (sizes.length) {
        const mean = sizes.reduce((a, b) => a + b, 0) / sizes.length;
        lines.push(`  set length averages ${mean.toFixed(1)} songs, ranging from ${Math.min(...sizes)} to ${Math.max(...sizes)}.`);
    }
    return lines.join("\n");
}
