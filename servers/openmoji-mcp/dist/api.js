/**
 * OpenMoji client, keyless.
 * The whole emoji dataset is one public JSON file, cached in memory per process.
 */
export class OpenmojiError extends Error {
    constructor(message) {
        super(message);
        this.name = "OpenmojiError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = "mrfentmen-openmoji-mcp/1.0";
const SOURCES = [
    "https://raw.githubusercontent.com/hfg-gmuend/openmoji/master/data/openmoji.json",
    "https://cdn.jsdelivr.net/npm/openmoji@15.0.0/data/openmoji.json",
];
let cache = null;
async function dataset() {
    if (cache)
        return cache;
    let lastError = "unknown error";
    for (const url of SOURCES) {
        try {
            const res = await fetch(url, {
                headers: { "User-Agent": UA, Accept: "application/json" },
                signal: AbortSignal.timeout(30000),
            });
            if (!res.ok) {
                lastError = `HTTP ${res.status}`;
                continue;
            }
            const rows = (await res.json());
            if (!Array.isArray(rows) || rows.length === 0) {
                lastError = "empty dataset";
                continue;
            }
            cache = rows;
            return cache;
        }
        catch (e) {
            lastError = errorMessage(e);
        }
    }
    throw new OpenmojiError(`Could not load the OpenMoji dataset (${lastError}).`);
}
export async function emojiCount() {
    return (await dataset()).length;
}
export async function searchEmoji(query, limit) {
    const q = query.trim().toLowerCase();
    if (!q)
        throw new OpenmojiError("A search keyword is required.");
    const size = clamp(limit, 1, 50, 10);
    const hits = (await dataset())
        .filter((e) => e.annotation.toLowerCase().includes(q) ||
        (e.tags ?? "").toLowerCase().includes(q) ||
        e.group.toLowerCase().includes(q) ||
        (e.subgroups ?? "").toLowerCase().includes(q))
        .slice(0, size);
    if (hits.length === 0)
        return `No OpenMoji emoji match "${query}".`;
    return formatList(hits, `OpenMoji results for "${query}"`);
}
export async function getEmoji(hexcode) {
    const wanted = hexcode.trim().toUpperCase().replace(/^U\+/, "");
    if (!/^[0-9A-F]{1,10}(-[0-9A-F]{1,10})*$/.test(wanted)) {
        throw new OpenmojiError(`"${hexcode}" is not a hexcode, e.g. '1F431' or '1F468-200D-1F4BB'.`);
    }
    const all = await dataset();
    const found = all.find((e) => e.hexcode.toUpperCase() === wanted);
    if (!found)
        throw new OpenmojiError(`No OpenMoji emoji with hexcode ${wanted}.`);
    return [
        `${found.emoji}  ${found.annotation}`,
        `  hexcode    ${found.hexcode}`,
        `  group      ${found.group}`,
        `  subgroup   ${found.subgroups}`,
        `  tags       ${found.tags || "none"}`,
        `  SVG        https://openmoji.org/data/color/svg/${found.hexcode}.svg`,
    ].join("\n");
}
export async function listGroups() {
    const all = await dataset();
    const counts = new Map();
    for (const e of all)
        counts.set(e.group, (counts.get(e.group) ?? 0) + 1);
    const lines = [...counts.entries()].map(([g, n]) => `  ${g.padEnd(24)} ${n}`);
    return `${counts.size} OpenMoji groups (${all.length} emoji total):\n\n${lines.join("\n")}`;
}
export async function listSubgroups(group) {
    const all = await dataset();
    const target = matchGroup(all, group);
    const counts = new Map();
    for (const e of all) {
        if (e.group !== target)
            continue;
        counts.set(e.subgroups, (counts.get(e.subgroups) ?? 0) + 1);
    }
    if (counts.size === 0)
        throw new OpenmojiError(`No OpenMoji group called "${group}".`);
    const lines = [...counts.entries()].map(([s, n]) => `  ${s.padEnd(28)} ${n}`);
    return `Subgroups of ${target}:\n\n${lines.join("\n")}`;
}
export async function emojisInGroup(group, subgroup, limit) {
    const all = await dataset();
    const target = matchGroup(all, group);
    const size = clamp(limit, 1, 100, 25);
    let rows = all.filter((e) => e.group === target);
    if (subgroup && subgroup.trim()) {
        const sub = subgroup.trim().toLowerCase();
        rows = rows.filter((e) => e.subgroups.toLowerCase().includes(sub));
        if (rows.length === 0) {
            throw new OpenmojiError(`No subgroup of ${target} matches "${subgroup}".`);
        }
    }
    const title = `${target}${subgroup ? ` / ${subgroup}` : ""}`;
    return formatList(rows.slice(0, size), `${title} - ${rows.length} emoji, showing ${Math.min(size, rows.length)}`);
}
export async function randomEmoji(group) {
    const all = await dataset();
    let pool = all;
    if (group && group.trim()) {
        const target = matchGroup(all, group);
        pool = all.filter((e) => e.group === target);
    }
    const pick = pool[Math.floor(Math.random() * pool.length)];
    return [
        `${pick.emoji}  ${pick.annotation}`,
        `  hexcode    ${pick.hexcode}`,
        `  group      ${pick.group}`,
        `  subgroup   ${pick.subgroups}`,
    ].join("\n");
}
export async function emojiStats() {
    const all = await dataset();
    const groups = new Map();
    for (const e of all)
        groups.set(e.group, (groups.get(e.group) ?? 0) + 1);
    const sequenced = all.filter((e) => e.hexcode.includes("-")).length;
    const largest = [...groups.entries()].sort((a, b) => b[1] - a[1])[0];
    return [
        "OpenMoji dataset statistics",
        "",
        `  emoji total      ${all.length}`,
        `  groups           ${groups.size}`,
        `  sequences (ZWJ)  ${sequenced}`,
        `  largest group    ${largest ? `${largest[0]} (${largest[1]})` : "n/a"}`,
        "",
        "Source: openmoji.org, CC BY-SA 4.0.",
    ].join("\n");
}
/** Group names in the dataset are slugs ('animals-nature'), users type 'Animals & Nature'. */
function slugify(name) {
    return name
        .toLowerCase()
        .replace(/&/g, " and ")
        .replace(/\band\b/g, " ")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}
function matchGroup(all, group) {
    const g = slugify(group);
    if (!g)
        throw new OpenmojiError("A group name is required - call list_groups for the options.");
    const names = [...new Set(all.map((e) => e.group))];
    const exact = names.find((n) => slugify(n) === g);
    if (exact)
        return exact;
    const partial = names.find((n) => slugify(n).includes(g) || g.includes(slugify(n)));
    if (partial)
        return partial;
    throw new OpenmojiError(`No OpenMoji group matches "${group}". Groups: ${names.join(", ")}.`);
}
function clamp(value, min, max, fallback) {
    const n = Number.isFinite(value) ? value : fallback;
    return Math.min(Math.max(Math.round(n), min), max);
}
function formatList(rows, title) {
    const lines = rows.map((e) => `  ${e.emoji}  ${e.annotation.padEnd(28)} ${e.hexcode}`);
    return `${title}:\n\n${lines.join("\n")}`;
}
const TONES = {
    "1F3FB": "light",
    "1F3FC": "medium-light",
    "1F3FD": "medium",
    "1F3FE": "medium-dark",
    "1F3FF": "dark",
};
const SVG_BASE = "https://openmoji.org/data";
const normalize = (value) => (value ?? "").trim().toUpperCase().replace(/^U\+/, "");
/** Find a dataset row by hexcode, by the emoji character itself, or by exact annotation. */
async function resolveEmoji(input) {
    const wanted = (input ?? "").trim();
    if (!wanted)
        throw new OpenmojiError("Give an emoji, a hexcode such as 1F44D, or an annotation such as 'thumbs up'.");
    const all = await dataset();
    const hex = normalize(wanted);
    const found = all.find((e) => e.hexcode.toUpperCase() === hex) ??
        all.find((e) => e.emoji === wanted) ??
        all.find((e) => e.annotation.toLowerCase() === wanted.toLowerCase());
    if (!found)
        throw new OpenmojiError(`No OpenMoji entry matches "${input}".`);
    return found;
}
const tagSet = (value) => new Set((value ?? "").split(",").map((t) => t.trim().toLowerCase()).filter(Boolean));
/**
 * The two SVG files OpenMoji publishes for one emoji, checked before they are
 * handed over, because a designer pasting a URL wants it to work.
 */
export async function svgLinks(args) {
    const entry = await resolveEmoji(args.hexcode);
    const hex = entry.hexcode.toUpperCase();
    const styles = ["color", "black"];
    const rows = await Promise.all(styles.map(async (style) => {
        const url = `${SVG_BASE}/${style}/svg/${hex}.svg`;
        try {
            const res = await fetch(url, { method: "HEAD", headers: { "User-Agent": UA }, signal: AbortSignal.timeout(20000) });
            const bytes = Number(res.headers.get("content-length") ?? 0);
            return {
                style,
                url,
                ok: res.ok,
                detail: res.ok ? `${res.headers.get("content-type") ?? "image/svg+xml"}${bytes ? `, ${(bytes / 1024).toFixed(1)} kB` : ""}` : `HTTP ${res.status}`,
            };
        }
        catch (e) {
            return { style, url, ok: false, detail: errorMessage(e) };
        }
    }));
    return [
        `SVG files for ${entry.emoji} (${hex}) — ${entry.annotation}`,
        "",
        ...rows.map((row) => `  ${row.style.padEnd(6)} ${row.ok ? "ok  " : "FAIL"} ${row.url}${row.ok ? ` (${row.detail})` : ` — ${row.detail}`}`),
        "",
        "OpenMoji is CC BY-SA 4.0, so credit the project wherever the artwork is used.",
    ].join("\n");
}
/**
 * The skin-tone run of one emoji, taken from the dataset's own base-hexcode
 * links rather than guessed from the code points.
 */
export async function skinToneVariants(args) {
    const base = await resolveEmoji(args.emoji);
    const all = await dataset();
    const variants = all
        .filter((e) => (e.skintone_base_hexcode ?? "").toUpperCase() === base.hexcode.toUpperCase() && e.hexcode.toUpperCase() !== base.hexcode.toUpperCase())
        .sort((a, b) => String(a.hexcode).localeCompare(String(b.hexcode)));
    if (!variants.length) {
        return [
            `${base.emoji} (${base.hexcode}) — ${base.annotation}`,
            "No skin-tone variants: this emoji is published in one form only.",
        ].join("\n");
    }
    return [
        `Skin-tone variants of ${base.emoji} (${base.hexcode}) — ${base.annotation}`,
        `  base: ${base.emoji} ${base.hexcode}`,
        "",
        ...variants.map((v) => {
            const tone = TONES[String(v.hexcode).split("-").pop() ?? ""] ?? "tone";
            return `  ${tone.padEnd(13)} ${v.emoji} ${v.hexcode} — ${v.annotation}`;
        }),
        "",
        `OpenMoji stores ${variants.length} variant(s) for this emoji, in the tones above; the base emoji is used when none is chosen.`,
    ].join("\n");
}
/** Two emoji compared on the metadata that decides whether they are interchangeable. */
export async function compareEmoji(args) {
    const first = await resolveEmoji(args.a);
    const second = await resolveEmoji(args.b);
    const firstTags = tagSet(first.tags);
    const secondTags = tagSet(second.tags);
    const shared = [...firstTags].filter((t) => secondTags.has(t)).sort();
    const onlyFirst = [...firstTags].filter((t) => !secondTags.has(t)).sort().slice(0, 12);
    const onlySecond = [...secondTags].filter((t) => !firstTags.has(t)).sort().slice(0, 12);
    const overlap = firstTags.size && secondTags.size ? Math.round((shared.length / Math.min(firstTags.size, secondTags.size)) * 100) : 0;
    return [
        `Emoji compare: ${first.emoji} ${first.hexcode} vs ${second.emoji} ${second.hexcode}`,
        `  ${first.annotation} | ${first.group} / ${first.subgroups}`,
        `  ${second.annotation} | ${second.group} / ${second.subgroups}`,
        "",
        first.group === second.group ? `Same group (${first.group}).` : `Different groups: ${first.group} vs ${second.group}.`,
        first.subgroups === second.subgroups
            ? `Same subgroup (${first.subgroups}).`
            : `Different subgroups: ${first.subgroups} vs ${second.subgroups}.`,
        `Tag overlap ${overlap}% — shared: ${shared.length ? shared.join(", ") : "none"}`,
        onlyFirst.length ? `  only in ${first.emoji}: ${onlyFirst.join(", ")}` : "",
        onlySecond.length ? `  only in ${second.emoji}: ${onlySecond.join(", ")}` : "",
        "",
        `Unicode version: ${first.unicode ?? "not stated"} vs ${second.unicode ?? "not stated"}; colours of the same subject usually share a subgroup, so a shared subgroup is the strongest signal that two emoji are near-duplicates.`,
    ].filter((line) => line !== "").join("\n");
}
// ---- muxG tools:
const OJ_UNICODE_URL = "https://unicode.org/Public/emoji/latest/emoji-test.txt";
const OJ_SKIN_TONES = {
    "\u{1F3FB}": "light skin tone",
    "\u{1F3FC}": "medium-light skin tone",
    "\u{1F3FD}": "medium skin tone",
    "\u{1F3FE}": "medium-dark skin tone",
    "\u{1F3FF}": "dark skin tone",
};
const OJ_VS16 = "\uFE0F";
const OJ_VS15 = "\uFE0E";
const OJ_KEYCAP = "\u20E3";
const OJ_ZWJ = "\u200D";
const OJ_REGIONAL = /[\u{1F1E6}-\u{1F1FF}]/u;
const OJ_LIST_CAP = 12;
let ojUnicodeCache = null;
async function ojUnicodeRows() {
    if (ojUnicodeCache)
        return ojUnicodeCache;
    const res = await fetch(OJ_UNICODE_URL, {
        headers: { "User-Agent": UA, Accept: "text/plain" },
        signal: AbortSignal.timeout(40000),
    });
    if (!res.ok)
        throw new OpenmojiError(`unicode.org returned ${res.status} for the official emoji list.`);
    const body = await res.text();
    const rows = [];
    let group = "not reported";
    let subgroup = "not reported";
    for (const line of body.split("\n")) {
        const g = /^# group: (.+)$/.exec(line);
        if (g) {
            group = g[1].trim();
            continue;
        }
        const s = /^# subgroup: (.+)$/.exec(line);
        if (s) {
            subgroup = s[1].trim();
            continue;
        }
        // "1F44D 1F3FB ; fully-qualified # <glyph> E0.6 thumbs up"
        const m = /^([0-9A-F ]+);\s*([a-z-]+)\s*#\s*(\S+)\s+E([0-9.]+)\s+(.*)$/.exec(line);
        if (!m)
            continue;
        rows.push({
            codepoints: m[1].trim(),
            status: m[2],
            glyph: m[3],
            version: `E${m[4]}`,
            name: m[5].trim(),
            group,
            subgroup,
        });
    }
    if (!rows.length)
        throw new OpenmojiError("The official Unicode emoji list parsed to zero rows, so it has probably changed format.");
    ojUnicodeCache = rows;
    return rows;
}
function ojBound(value, min, max, fallback) {
    const n = Number(value);
    if (!Number.isFinite(n))
        return fallback;
    return Math.max(min, Math.min(Math.floor(n), max));
}
function ojCleanHex(input) {
    const raw = String(input ?? "")
        .toUpperCase()
        .replace(/U\+/g, "")
        .replace(/0X/g, "")
        .trim();
    // A registered sequence can be up to several codepoints long (ZWJ, skin tone,
    // keycap, tag), so validate each group rather than the joined string.
    const groups = raw.split(/[\s-]+/).filter(Boolean);
    if (!groups.length || groups.length > 10 || groups.some((g) => !/^[0-9A-F]{4,6}$/.test(g))) {
        throw new OpenmojiError(`"${input}" is not a codepoint sequence. Pass hex codepoints separated by spaces, for example 1F44D, 1F44D 1F3FB, or 1F469 200D 1F4BB.`);
    }
    return groups.join(" ");
}
/** Check a string of text for the emoji mistakes that actually break rendering, locally. */
export async function emojiLint(args) {
    const input = String(args?.input ?? "");
    if (!input.trim())
        throw new OpenmojiError("input is empty. Paste the string you want checked.");
    const codePoints = [...input];
    const problems = [];
    const tones = [];
    const flags = [];
    let vs16 = 0;
    let vs15 = 0;
    let zwjSequences = 0;
    let keycaps = 0;
    let tagFlags = 0;
    let surrogatePairs = 0;
    for (let i = 0; i < codePoints.length; i += 1) {
        const cp = codePoints[i];
        if (cp in OJ_SKIN_TONES) {
            const base = codePoints[i - 1];
            // A skin tone modifier only tints a symbol. A letter, digit, space or
            // punctuation mark before it is a mistake, not a base.
            const looksLikeSymbol = Boolean(base) && !/[\sA-Za-z0-9.,!?;:'"()\[\]{}<>/\\@#$%^&*+=~-]/u.test(base);
            if (!base || !looksLikeSymbol) {
                problems.push(`position ${i}: a ${OJ_SKIN_TONES[cp]} modifier (U+${cp.codePointAt(0)?.toString(16).toUpperCase()}) follows ${base ? `"${base}", which is not a symbol` : "nothing"}, so it has no emoji to tint and renders on its own or as a box`);
            }
            tones.push(OJ_SKIN_TONES[cp]);
        }
        if (cp === OJ_VS16)
            vs16 += 1;
        if (cp === OJ_VS15)
            vs15 += 1;
        if (cp === OJ_ZWJ)
            zwjSequences += 1;
        if (cp === OJ_KEYCAP)
            keycaps += 1;
        if (cp === "\u{1F3F4}") {
            // A black flag followed by tag characters is a subdivision flag, not a placeholder.
            const window = codePoints.slice(i, i + 12).join("");
            if (window.includes("\u{E0067}"))
                tagFlags += 1;
        }
    }
    for (let i = 0; i < codePoints.length; i += 1) {
        if (!OJ_REGIONAL.test(codePoints[i]))
            continue;
        const a = codePoints[i];
        if (OJ_REGIONAL.test(codePoints[i - 1] ?? ""))
            continue;
        const b = codePoints[i + 1] ?? "";
        if (OJ_REGIONAL.test(b)) {
            const letters = String.fromCodePoint(a.codePointAt(0) - 0x1f1e6 + 65) + String.fromCodePoint(b.codePointAt(0) - 0x1f1e6 + 65);
            flags.push({ pair: a + b, letters });
        }
        else {
            problems.push(`position ${i}: a single regional indicator ("${a}") with no partner, so it renders as a letter box instead of a flag`);
        }
    }
    const graphemes = typeof Intl !== "undefined" && "Segmenter" in Intl
        ? [...new Intl.Segmenter("en", { granularity: "grapheme" }).segment(input)].length
        : codePoints.length;
    const utf16 = input.length;
    if (utf16 !== codePoints.length)
        surrogatePairs = Math.round((utf16 - codePoints.length) / 1);
    if (vs15)
        problems.push(`${vs15} variation selector-15 (text presentation) request(s): those force the text glyph, which is usually not what a chat message wants`);
    if (zwjSequences && zwjSequences % 2 === 0 && zwjSequences > 0) {
        zwjSequences = zwjSequences / 2;
    }
    return [
        "Emoji lint, computed locally on the string you supplied",
        `String: ${utf16} UTF-16 code unit(s), ${codePoints.length} code point(s), ${graphemes} grapheme cluster(s)${surrogatePairs ? `, ${surrogatePairs} of them astral-plane` : ""}`,
        `Emoji presentation selectors (U+FE0F): ${vs16}${vs16 === 0 ? ", none, so any emoji that defaults to text presentation will render as plain characters" : ""}`,
        `Text presentation selectors (U+FE0E): ${vs15}`,
        `Skin tone modifiers: ${tones.length}${tones.length ? ` (${[...new Set(tones)].join(", ")})` : ""}`,
        `ZWJ sequences: ${zwjSequences}${zwjSequences ? ", so compare by grapheme clusters, never by code unit" : ""}`,
        `Keycap sequences: ${keycaps}`,
        `Subdivision tag flags (waving black flag plus tags): ${tagFlags}`,
        `Regional indicator flags: ${flags.length}${flags.length ? ` (${flags.map((f) => `${f.pair} = ${f.letters}`).join(", ")})` : ""}`,
        "",
        problems.length ? "Problems found:" : "No structural problem found in this string.",
        ...problems.map((p) => `  - ${p}`),
        "",
        "This checks structure only. It cannot tell you whether a sequence is a registered emoji, whether a font on the target platform has a glyph, or whether a country code pair is one the flag emoji set actually publishes.",
        "The grapheme cluster count is the number that matters for a length limit in a database column or an SMS; UTF-16 length is not.",
    ].filter(Boolean).join("\n");
}
