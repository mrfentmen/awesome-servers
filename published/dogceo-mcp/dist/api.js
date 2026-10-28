/**
 * Dog CEO — keyless public API client.
 */
const BASE = "https://dog.ceo/api";
const SOURCE = "Dog CEO";
export class SourceError extends Error {
}
async function request(path, accept = "application/json", timeoutMs = 25000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(path.startsWith("http") ? path : BASE + path, {
            signal: ctrl.signal,
            headers: { "user-agent": "dogceo-mcp", accept },
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
function checkBreed(value, what) {
    const v = clean(value).toLowerCase();
    if (!/^[a-z-]{2,30}$/.test(v))
        throw new SourceError(`"${value}" is not a valid ${what}`);
    return v;
}
function friendly404(e, message) {
    if (e instanceof SourceError && / 404$/.test(e.message))
        throw new SourceError(message);
    throw e;
}
export async function randomDogImage(a) {
    const sub = a.subBreed ? checkBreed(a.subBreed, "sub-breed") : "";
    const breed = a.breed ? checkBreed(a.breed, "breed") : "";
    if (sub && !breed)
        throw new SourceError("give a breed alongside a sub-breed");
    const path = breed ? `/breed/${breed}${sub ? `/${sub}` : ""}/images/random` : "/breeds/image/random";
    let body;
    try {
        body = await getJson(path, "application/json", 25000);
    }
    catch (e) {
        friendly404(e, `dog.ceo has no breed "${breed}${sub ? ` / ${sub}` : ""}"`);
    }
    if (body?.status !== "success" || !body?.message)
        throw new SourceError("dog.ceo returned no image");
    const url = clean(body.message);
    const breedName = clean((url.split("/breeds/")[1] ?? "").split("/")[0]).replace(/-/g, " ");
    return [
        url,
        "",
        breedName ? `Breed from the path: ${breedName}` : "",
    ].filter(Boolean).join("\n");
}
export async function listBreeds(a) {
    const limit = clampLimit(a.limit, 25, 250);
    const body = await getJson("/breeds/list/all", "application/json", 25000);
    if (body?.status !== "success" || !body?.message)
        throw new SourceError("dog.ceo returned no breed list");
    const breeds = Object.keys(body.message).sort();
    const shown = breeds.slice(0, limit);
    const withSubs = breeds.filter((b) => Array.isArray(body.message[b]) && body.message[b].length).length;
    return [
        `${breeds.length} breed(s) on dog.ceo, ${withSubs} with sub-breeds (showing ${shown.length}):`,
        "",
        ...shown.map((b) => {
            const subs = body.message[b] ?? [];
            return `${b}${subs.length ? ` — ${subs.join(", ")}` : ""}`;
        }),
        "",
        "Use breed_images with a breed name for every photo, or random_dog_image for one.",
    ].join("\n");
}
export async function breedImages(a) {
    const limit = clampLimit(a.limit, 10, 50);
    const breed = checkBreed(a.breed, "breed");
    const sub = a.subBreed ? checkBreed(a.subBreed, "sub-breed") : "";
    const path = `/breed/${breed}${sub ? `/${sub}` : ""}/images`;
    let body;
    try {
        body = await getJson(path, "application/json", 25000);
    }
    catch (e) {
        friendly404(e, `dog.ceo has no breed "${breed}${sub ? ` / ${sub}` : ""}"`);
    }
    const images = Array.isArray(body?.message) ? body.message : [];
    if (!images.length)
        throw new SourceError(`dog.ceo has no images for "${breed}${sub ? ` / ${sub}` : ""}"`);
    const shown = images.slice(0, limit);
    return [
        `${breed}${sub ? ` / ${sub}` : ""} — ${images.length} image(s), showing ${shown.length}:`,
        "",
        ...shown,
    ].join("\n");
}
