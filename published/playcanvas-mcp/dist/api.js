export class PlayCanvasError extends Error {
    constructor(message) {
        super(message);
        this.name = "PlayCanvasError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
const BASE = "https://playcanvas.com/api";
function envStrict(name) {
    const v = process.env[name];
    if (!v)
        throw new PlayCanvasError(`Set the ${name} environment variable.`);
    return v;
}
function pretty(data) {
    const t = typeof data === "string" ? data : JSON.stringify(data, null, 2);
    return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t;
}
async function req(path) {
    const res = await fetch(BASE + path, {
        signal: AbortSignal.timeout(30000),
        headers: { ...UA, Authorization: "Bearer " + envStrict("PLAYCANVAS_ACCESS_TOKEN") },
    });
    const ct = res.headers.get("content-type") ?? "";
    const data = ct.includes("json") ? await res.json() : await res.text();
    if (!res.ok) {
        const detail = typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300);
        throw new PlayCanvasError(`HTTP ${res.status}: ${detail}`);
    }
    return pretty(data);
}
export function listProjectAssets(projectId, branchId, limit) {
    const p = new URLSearchParams({ branchId });
    if (limit)
        p.set("limit", limit);
    return req(`/projects/${encodeURIComponent(projectId)}/assets?${p.toString()}`);
}
export function getAsset(assetId, branchId) {
    return req(`/assets/${encodeURIComponent(assetId)}?branchId=${encodeURIComponent(branchId)}`);
}
export function getRateLimits() {
    return req("/ratelimits");
}
let packumentCache = null;
// ---- muxF tools:
// The npm registry and the GitHub API are public, so neither uses req(), which
// demands PLAYCANVAS_ACCESS_TOKEN.
const PC_PACKAGE = "playcanvas";
async function pcJson(url) {
    const res = await fetch(url, {
        signal: AbortSignal.timeout(25000),
        headers: { ...UA, Accept: "application/json" },
    });
    if (res.status === 404)
        return null;
    const ct = res.headers.get("content-type") ?? "";
    const data = ct.includes("json") ? await res.json() : await res.text();
    if (!res.ok) {
        const detail = typeof data === "string" ? data.slice(0, 200) : JSON.stringify(data).slice(0, 200);
        throw new PlayCanvasError(`HTTP ${res.status} from ${new URL(url).hostname}: ${detail}`);
    }
    return data;
}
async function pcPackument() {
    if (packumentCache)
        return packumentCache;
    const doc = await pcJson(`https://registry.npmjs.org/${PC_PACKAGE}`);
    if (!doc)
        throw new PlayCanvasError(`npm has no package called ${PC_PACKAGE}.`);
    packumentCache = doc;
    return doc;
}
function pcDaysSince(iso) {
    const t = new Date(iso).getTime();
    return Number.isFinite(t) ? Math.floor((Date.now() - t) / 86400000) : null;
}
const PC_STABLE = /^\d+\.\d+\.\d+$/;
export async function engineReleaseChannels(args) {
    const doc = await pcPackument();
    const wantPrerelease = args?.include_prerelease !== false;
    const tags = doc["dist-tags"] ?? {};
    const channels = Object.entries(tags)
        .map(([tag, version]) => ({
        tag,
        version,
        published: doc.time?.[version] ?? null,
        age_days: pcDaysSince(doc.time?.[version]),
        prerelease: !PC_STABLE.test(String(version)),
    }))
        .filter((row) => wantPrerelease || !row.prerelease)
        .sort((a, b) => String(a.tag).localeCompare(String(b.tag)));
    const stableDates = Object.entries(doc.time ?? {})
        .filter(([v]) => PC_STABLE.test(v))
        .map(([, iso]) => new Date(iso).getTime())
        .filter((n) => Number.isFinite(n))
        .sort((a, b) => b - a)
        .slice(0, 13);
    const gaps = [];
    for (let i = 1; i < stableDates.length; i += 1)
        gaps.push(Math.round((stableDates[i - 1] - stableDates[i]) / 86400000 * 10) / 10);
    const medianGap = gaps.length
        ? [...gaps].sort((a, b) => a - b)[gaps.length % 2 ? (gaps.length - 1) / 2 : Math.round((gaps.length - 1) / 2)]
        : null;
    if (!channels.length)
        throw new PlayCanvasError(`npm publishes no dist-tags for ${PC_PACKAGE}.`);
    return pretty({
        package: PC_PACKAGE,
        channels,
        stable_releases_considered: stableDates.length,
        median_days_between_stable_releases: medianGap,
        note: "Tags come from npm dist-tags, so a channel is whatever the maintainers point it at; only x.y.z versions are counted as stable, and the cadence is the median gap between the most recent stable publications.",
    });
}
export async function engineReleaseNotes(args) {
    const limit = Math.min(Math.max(Number(args?.limit ?? 6) || 6, 1), 15);
    const wantPrerelease = args?.include_prerelease !== false;
    const doc = await pcPackument();
    const raw = doc.repository?.url ?? doc.repository ?? "";
    const match = typeof raw === "string" ? raw.match(/github\.com[/:]([\w.-]+)\/([\w.-]+)/i) : null;
    if (!match)
        throw new PlayCanvasError("The npm metadata for playcanvas does not name a GitHub repository, so its releases cannot be read.");
    const slug = `${match[1]}/${match[2].replace(/\.git$/i, "")}`;
    const releases = await pcJson(`https://api.github.com/repos/${slug}/releases?per_page=30`);
    if (!Array.isArray(releases))
        throw new PlayCanvasError(`GitHub returned no release list for ${slug}.`);
    const picked = releases
        .filter((r) => r && (wantPrerelease || !r.prerelease))
        .slice(0, limit)
        .map((r) => ({
        tag: r.tag_name,
        name: r.name ?? r.tag_name,
        published: r.published_at ?? null,
        age_days: pcDaysSince(r.published_at),
        prerelease: Boolean(r.prerelease),
        url: r.html_url ?? null,
        notes: String(r.body ?? "").replace(/\r/g, "").trim().slice(0, 1200) || "(no release notes published)",
    }));
    if (!picked.length)
        throw new PlayCanvasError(`No ${wantPrerelease ? "" : "stable "}releases are published for ${slug}.`);
    return pretty({
        repo: slug,
        releases: picked,
        note: "Bodies are GitHub release text, trimmed to 1200 characters each; they are the maintainers' own notes, not a generated changelog.",
    });
}
