const BASE = "https://images-api.nasa.gov";
export class NasaImagesError extends Error {
}
async function getJson(url, timeoutMs = 30000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(url, {
            signal: ctrl.signal,
            headers: { "user-agent": "nasa-images-mcp", accept: "application/json" },
        });
        if (res.status === 404)
            throw new NasaImagesError("Not found in the NASA image library");
        if (!res.ok)
            throw new NasaImagesError(`NASA image API responded ${res.status}`);
        return await res.json();
    }
    catch (e) {
        if (e instanceof NasaImagesError)
            throw e;
        if (e.name === "AbortError")
            throw new NasaImagesError("NASA image request timed out");
        throw new NasaImagesError(`NASA image request failed: ${e.message}`);
    }
    finally {
        clearTimeout(timer);
    }
}
function items(payload) {
    return payload?.collection?.items ?? [];
}
function first(payload) {
    const it = items(payload)[0];
    if (!it)
        throw new NasaImagesError("No record matched that identifier");
    return { ...(it.data?.[0] ?? {}), thumb: it.links?.[0]?.href ?? "" };
}
function badge(iso) {
    return typeof iso === "string" ? iso.slice(0, 10) : "undated";
}
function row(it, i) {
    const d = it.data?.[0] ?? {};
    return `${i + 1}. ${d.title ?? "(untitled)"} [${d.media_type ?? "?"}] ${badge(d.date_created)} — ${d.center ?? "NASA"}\n   id: ${d.nasa_id ?? "?"}\n   ${(d.description ?? "").replace(/\s+/g, " ").slice(0, 180)}`;
}
export async function searchMedia(query, mediaType, limit) {
    const params = new URLSearchParams({ q: query, page_size: String(limit) });
    if (mediaType !== "any")
        params.set("media_type", mediaType);
    const d = await getJson(`${BASE}/search?${params.toString()}`);
    const rows = items(d);
    if (rows.length === 0)
        return `Nothing in the NASA library matched "${query}".`;
    return `NASA library results for "${query}" (${d.collection?.metadata?.total_hits ?? rows.length} hits):\n\n${rows.map(row).join("\n")}`;
}
export async function itemDetail(nasaId) {
    const d = first(await getJson(`${BASE}/search?nasa_id=${encodeURIComponent(nasaId)}`));
    const rows = [
        `Title: ${d.title ?? "(untitled)"}`,
        `NASA ID: ${d.nasa_id ?? nasaId}`,
        `Type: ${d.media_type ?? "?"}   Center: ${d.center ?? "NASA"}   Date: ${badge(d.date_created)}`,
        `Photographer: ${d.photographer ?? d.secondary_creator ?? "unknown"}`,
    ];
    if (Array.isArray(d.keywords) && d.keywords.length)
        rows.push(`Keywords: ${d.keywords.slice(0, 12).join(", ")}`);
    if (d.description)
        rows.push("", d.description.replace(/\s+/g, " ").slice(0, 900));
    if (d.thumb)
        rows.push("", `Thumbnail: ${d.thumb}`);
    return rows.join("\n");
}
export async function assetFiles(nasaId) {
    const d = await getJson(`${BASE}/asset/${encodeURIComponent(nasaId)}`);
    const files = (d?.collection?.items ?? []).map((x) => x.href).filter(Boolean);
    if (files.length === 0)
        throw new NasaImagesError(`No files listed for ${nasaId}`);
    const kind = (href) => {
        const m = /~(orig|large|medium|small|thumb)\.(\w+)$/.exec(href);
        if (m)
            return `${m[1].toUpperCase()} ${m[2]}`;
        return href.toLowerCase().endsWith(".json") ? "metadata json" : "file";
    };
    const rows = files.map((f) => `   ${kind(f)}: ${f}`);
    const originals = files.filter((f) => /~orig\./.test(f));
    return [
        `Files for ${nasaId} (${files.length} entries):`,
        ...rows,
        "",
        originals.length ? `Best-quality download: ${originals[0]}` : "No ~orig file listed.",
    ].join("\n");
}
export async function byCenter(center, limit) {
    const params = new URLSearchParams({ center: center.toUpperCase(), media_type: "image", page_size: String(limit) });
    const d = await getJson(`${BASE}/search?${params.toString()}`);
    const rows = items(d);
    if (rows.length === 0)
        return `No images found for center "${center}".`;
    return `NASA images from ${center.toUpperCase()} (${rows.length} shown):\n\n${rows.map(row).join("\n")}`;
}
export async function recentMedia(yearStart, limit) {
    const params = new URLSearchParams({ year_start: String(Math.trunc(yearStart)), page_size: String(limit) });
    const d = await getJson(`${BASE}/search?${params.toString()}`);
    const rows = items(d);
    if (rows.length === 0)
        return `Nothing published in the archive since ${yearStart}.`;
    return `NASA media added since ${yearStart} (${rows.length} shown):\n\n${rows.map(row).join("\n")}`;
}
export async function keywordSummary(query, limit) {
    const params = new URLSearchParams({ q: query, page_size: String(Math.max(limit, 20)) });
    const d = await getJson(`${BASE}/search?${params.toString()}`);
    const rows = items(d);
    if (rows.length === 0)
        return `No records to summarise for "${query}".`;
    const tally = new Map();
    const centers = new Map();
    const types = new Map();
    for (const it of rows) {
        const dd = it.data?.[0] ?? {};
        for (const k of dd.keywords ?? [])
            tally.set(k, (tally.get(k) ?? 0) + 1);
        if (dd.center)
            centers.set(dd.center, (centers.get(dd.center) ?? 0) + 1);
        if (dd.media_type)
            types.set(dd.media_type, (types.get(dd.media_type) ?? 0) + 1);
    }
    const top = (m, n) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => `${k} (${v})`).join(", ") || "none";
    return [
        `Summary of ${rows.length} NASA records for "${query}"`,
        `Keywords: ${top(tally, 12)}`,
        `Centers: ${top(centers, 6)}`,
        `Media types: ${top(types, 4)}`,
    ].join("\n");
}
