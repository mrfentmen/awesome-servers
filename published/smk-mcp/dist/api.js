/**
 * SMK National Gallery of Denmark — keyless public API client.
 */
const BASE = "https://api.smk.dk/api/v1";
const SOURCE = "SMK National Gallery of Denmark";
export class SourceError extends Error {
}
async function request(path, accept = "application/json", timeoutMs = 25000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(path.startsWith("http") ? path : BASE + path, {
            signal: ctrl.signal,
            headers: { "user-agent": "smk-mcp", accept },
        });
        if (!res.ok)
            throw new SourceError(`${SOURCE} responded ${res.status}`);
        return res;
    }
    catch (e) {
        if (e instanceof SourceError)
            throw e;
        if (e.name === "AbortError")
            throw new SourceError(`${SOURCE} request timed out`);
        throw new SourceError(`${SOURCE} request failed: ${e.message}`);
    }
    finally {
        clearTimeout(timer);
    }
}
export async function getJson(path, accept = "application/json", timeoutMs = 25000) {
    const res = await request(path, accept, timeoutMs);
    const body = await res.text();
    try {
        return JSON.parse(body);
    }
    catch {
        throw new SourceError(`${SOURCE} returned malformed JSON`);
    }
}
export function clampLimit(n, fallback, max) {
    const v = n ?? fallback;
    if (!Number.isInteger(v) || v < 1 || v > max)
        throw new SourceError(`limit must be between 1 and ${max}`);
    return v;
}
export function clean(s) {
    return String(s ?? "").replace(/\s+/g, " ").trim();
}
export function bullet(label, value) {
    const v = value === undefined || value === null || value === "" ? "" : String(value);
    return v ? `${label}: ${v}` : "";
}
function title(item) {
    if (Array.isArray(item?.titles) && item.titles.length)
        return clean(item.titles[0]?.title);
    return clean(item?.title);
}
function artists(item) {
    const out = [];
    for (const key of ["artist", "artists"]) {
        const value = item?.[key];
        if (Array.isArray(value)) {
            for (const a of value)
                out.push(clean(a?.name ?? a?.full_name ?? a));
        }
    }
    return [...new Set(out.filter(Boolean))];
}
function dates(item) {
    const value = item?.production_date;
    if (Array.isArray(value) && value.length) {
        const first = value[0];
        if (Array.isArray(first?.period))
            return first.period.map((p) => clean(p)).filter(Boolean).join("-");
        return clean(first?.period ?? first);
    }
    return clean(item?.production_date);
}
function thumbs(item) {
    return clean(item?.image_thumbnail ?? item?.image_native ?? "");
}
async function search(keys, limit) {
    const data = await getJson(`/art/search/?keys=${encodeURIComponent(keys)}&offset=0&limit=${Math.max(limit, 10)}&filters=%5Bhas_image%3Atrue%5D`, "application/json", 30000);
    const items = data?.items;
    if (!Array.isArray(items))
        throw new SourceError("SMK returned an unexpected payload");
    return items;
}
export async function searchArt(a) {
    const limit = clampLimit(a.limit, 10, 50);
    const q = clean(a.query);
    const items = await search(q, limit);
    const withImages = items.filter((i) => thumbs(i));
    const shown = (withImages.length ? withImages : items).slice(0, limit);
    if (!shown.length)
        return `SMK has no artworks matching "${q}".`;
    return [
        `${items.length} result(s) for "${q}" (showing ${shown.length}${withImages.length ? ", images only" : ""}):`,
        "",
        ...shown.map((item, i) => {
            const who = artists(item);
            const when = dates(item);
            const bits = [when, who.slice(0, 2).join(", ")].filter(Boolean);
            return `${i + 1}. ${title(item) || "(untitled)"} · ${clean(item?.object_number)}${bits.length ? `\n   ${bits.join(" · ")}` : ""}`;
        }),
    ].join("\n");
}
export async function searchByArtist(a) {
    const limit = clampLimit(a.limit, 10, 50);
    const name = clean(a.artist);
    const items = await search(name, Math.max(limit, 30));
    const needle = name.toLowerCase();
    const hits = items.filter((item) => artists(item).some((aName) => aName.toLowerCase().includes(needle)));
    if (!hits.length)
        return `No SMK artworks found with an artist matching "${name}".`;
    return [
        `${hits.length} artwork(s) with an artist matching "${name}" (showing ${Math.min(limit, hits.length)}):`,
        "",
        ...hits.slice(0, limit).map((item, i) => {
            const who = artists(item);
            const when = dates(item);
            return `${i + 1}. ${title(item) || "(untitled)"} · ${clean(item?.object_number)}${who.length ? `\n   ${who.join(", ")}${when ? ` · ${when}` : ""}` : ""}`;
        }),
    ].join("\n");
}
export async function artworkDetail(a) {
    const id = clean(a.objectNumber);
    if (!/^[A-Za-z0-9._-]{2,40}$/.test(id))
        throw new SourceError(`"${id}" is not a valid SMK object number`);
    const data = await getJson(`/art/?object_number=${encodeURIComponent(id)}`, "application/json", 30000);
    const item = Array.isArray(data?.items) ? data.items[0] : undefined;
    if (!item)
        throw new SourceError(`SMK has no object "${id}"`);
    const techniques = Array.isArray(item?.techniques) ? item.techniques.map((t) => clean(t)).filter(Boolean) : [];
    const dims = [];
    for (const d of Array.isArray(item?.dimensions) ? item.dimensions : []) {
        const parts = [clean(d?.type), d?.value !== undefined ? `${clean(d.value)} ${clean(d?.unit)}`.trim() : ""].filter(Boolean);
        if (parts.length)
            dims.push(parts.join(" "));
    }
    const description = clean(item?.content_description ?? item?.description);
    const image = thumbs(item);
    const native = clean(item?.image_native);
    return [
        `${title(item) || "(untitled)"} (${clean(item?.object_number)})`,
        "",
        bullet("artist(s)", artists(item).join(", ")),
        bullet("production", dates(item)),
        bullet("techniques", techniques.join(", ")),
        bullet("dimensions", dims.slice(0, 4).join("; ")),
        bullet("department", item?.responsible_department),
        bullet("acquisition", item?.acquisition_date ? clean(item.acquisition_date).slice(0, 10) : ""),
        "",
        description ? description.slice(0, 600) : "No catalogue description on record.",
        image ? `\nThumbnail: ${image}` : "",
        native ? `Image: ${native}` : "",
    ].filter(Boolean).join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
