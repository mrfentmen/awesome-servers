const BASE = "https://hub.docker.com/v2";
export class DockerHubError extends Error {
}
async function getJson(url, timeoutMs = 20000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(url, {
            signal: ctrl.signal,
            headers: { "user-agent": "dockerhub-mcp", accept: "application/json" },
        });
        if (res.status === 404)
            throw new DockerHubError("Not found on Docker Hub");
        if (!res.ok)
            throw new DockerHubError(`Docker Hub responded ${res.status}`);
        return await res.json();
    }
    catch (e) {
        if (e instanceof DockerHubError)
            throw e;
        if (e.name === "AbortError")
            throw new DockerHubError("Docker Hub request timed out");
        throw new DockerHubError(`Docker Hub request failed: ${e.message}`);
    }
    finally {
        clearTimeout(timer);
    }
}
export function splitRef(ref) {
    const clean = ref.trim().replace(/^docker\.io\//, "").replace(/^\/+/, "");
    const parts = clean.split("/").filter(Boolean);
    if (parts.length === 0)
        throw new DockerHubError("Image reference is empty");
    if (parts.length === 1)
        return { namespace: "library", name: parts[0] };
    return { namespace: parts[0], name: parts[1] };
}
function num(n) {
    const v = typeof n === "number" ? n : Number(n ?? 0);
    if (!Number.isFinite(v))
        return "0";
    if (v >= 1e9)
        return `${(v / 1e9).toFixed(1)}B`;
    if (v >= 1e6)
        return `${(v / 1e6).toFixed(1)}M`;
    if (v >= 1e3)
        return `${(v / 1e3).toFixed(1)}k`;
    return String(v);
}
function day(iso) {
    if (typeof iso !== "string" || !iso)
        return "unknown";
    return iso.slice(0, 10);
}
// Docker Hub reports is_official=false for library/* images, so the namespace decides.
function isOfficial(d) {
    return Boolean(d?.is_official) || d?.namespace === "library";
}
export async function searchImages(query, limit) {
    const url = `${BASE}/search/repositories/?query=${encodeURIComponent(query)}&page_size=${limit}`;
    const d = await getJson(url);
    const rows = d.results ?? [];
    if (rows.length === 0)
        return `No Docker Hub images matched "${query}".`;
    const lines = rows.map((r, i) => {
        const full = r.repo_owner ? `${r.repo_owner}/${r.repo_name}` : r.repo_name;
        const flags = [r.is_official ? "official" : "", r.is_automated ? "automated" : ""].filter(Boolean);
        return `${i + 1}. ${full}${flags.length ? ` [${flags.join(", ")}]` : ""} — ${num(r.star_count)} stars, ${num(r.pull_count)} pulls\n   ${(r.short_description || "no description").replace(/\s+/g, " ").slice(0, 160)}`;
    });
    return `Docker Hub matches for "${query}" (${num(d.count)} total):\n\n${lines.join("\n")}`;
}
export async function imageDetails(ref) {
    const { namespace, name } = splitRef(ref);
    const d = await getJson(`${BASE}/repositories/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}/`);
    const rows = [
        `Image: ${d.namespace}/${d.name}`,
        `Description: ${(d.description || d.full_description || "none").replace(/\s+/g, " ").slice(0, 300)}`,
        `Stars: ${num(d.star_count)}   Pulls: ${num(d.pull_count)}`,
        `Official: ${isOfficial(d) ? "yes" : "no"}   Automated build: ${d.is_automated ? "yes" : "no"}`,
        `Last updated: ${day(d.last_updated)}   Status: ${d.status_description ?? "unknown"}`,
    ];
    if (d.last_updated)
        rows.push(`Last pulled: ${day(d.last_pulled)}`);
    return rows.join("\n");
}
export async function imageTags(ref, limit, ordering) {
    const { namespace, name } = splitRef(ref);
    const url = `${BASE}/repositories/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}/tags/?page_size=${limit}&ordering=${encodeURIComponent(ordering)}`;
    const d = await getJson(url);
    const rows = d.results ?? [];
    if (rows.length === 0)
        return `No tags found for ${namespace}/${name}.`;
    const lines = rows.map((t, i) => {
        const arches = [
            ...new Set((t.images ?? [])
                .map((im) => (im.architecture === "unknown" ? "" : im.architecture))
                .filter(Boolean)),
        ];
        const size = (t.full_size ?? t.compressed_size ?? 0);
        return `${i + 1}. ${t.name} — ${(size / 1048576).toFixed(1)} MB, ${arches.length ? arches.join("/") : "no arch info"}, updated ${day(t.last_updated)}`;
    });
    return `Tags for ${namespace}/${name} (${num(d.count)} total, ordered by ${ordering}):\n\n${lines.join("\n")}`;
}
export async function officialImages(limit) {
    // Docker Hub has no server-side sort here and blocks deep paging, so rank one 100-image pool locally.
    const d = await getJson(`${BASE}/repositories/library/?page_size=100&page=1`);
    const all = d.results ?? [];
    if (all.length === 0)
        return "Docker Hub returned no official images.";
    const ranked = [...all].sort((a, b) => Number(b.pull_count ?? 0) - Number(a.pull_count ?? 0));
    const slice = ranked.slice(0, limit);
    const lines = slice.map((r, i) => `${i + 1}. ${r.name} — ${num(r.pull_count)} pulls, ${num(r.star_count)} stars, updated ${day(r.last_updated)}`);
    return `Official Docker images ranked by pulls (${num(d.count)} total, top ${slice.length} of the ${ranked.length} sampled):\n\n${lines.join("\n")}`;
}
export async function tagInfo(ref, tag) {
    const { namespace, name } = splitRef(ref);
    const d = await getJson(`${BASE}/repositories/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}/tags/${encodeURIComponent(tag)}/`);
    const imgs = d.images ?? [];
    const perArch = imgs.map((im) => `   ${im.architecture}/${im.os ?? "linux"}${im.variant ? ` (${im.variant})` : ""} — ${((im.size ?? 0) / 1048576).toFixed(1)} MB, digest ${String(im.digest ?? "").slice(0, 23)}`);
    const rows = [
        `Tag: ${namespace}/${name}:${d.name}`,
        `Digest: ${d.digest ?? "n/a"}`,
        (d.compressed_size ?? 0) > 0
            ? `Compressed: ${((d.compressed_size ?? 0) / 1048576).toFixed(1)} MB   Full: ${((d.full_size ?? 0) / 1048576).toFixed(1)} MB`
            : `Size: ${((d.full_size ?? 0) / 1048576).toFixed(1)} MB`,
        `Last updated: ${day(d.last_updated)}   Last pushed: ${day(d.tag_last_pushed)}`,
        `Architectures: ${imgs.length}`,
        ...perArch,
    ];
    return rows.join("\n");
}
async function detail(ref) {
    const { namespace, name } = splitRef(ref);
    return getJson(`${BASE}/repositories/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}/`);
}
export async function compareImages(a, b) {
    const [x, y] = await Promise.all([detail(a), detail(b)]);
    const line = (label, key, fmt) => `${label.padEnd(9)}A ${fmt(x[key])}   B ${fmt(y[key])}`;
    return [
        `A: ${x.namespace}/${x.name}`,
        `B: ${y.namespace}/${y.name}`,
        "",
        line("Stars", "star_count", (v) => num(v)),
        line("Pulls", "pull_count", (v) => num(v)),
        line("Updated", "last_updated", (v) => day(v)),
        `Official A ${isOfficial(x) ? "yes" : "no"}   B ${isOfficial(y) ? "yes" : "no"}`,
        line("Status", "status_description", (v) => String(v ?? "unknown")),
    ].join("\n");
}
