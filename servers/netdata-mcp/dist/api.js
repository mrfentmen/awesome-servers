export class NetdataError extends Error {
    constructor(message) {
        super(message);
        this.name = "NetdataError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
function base() {
    const b = process.env.NETDATA_URL;
    if (!b)
        throw new NetdataError("Set NETDATA_URL (your Netdata agent URL).");
    return b.replace(/\/$/, "");
}
function headers() {
    const h = { ...UA, Accept: "application/json" };
    if (process.env.NETDATA_TOKEN)
        h.Authorization = `Bearer ${process.env.NETDATA_TOKEN}`;
    return h;
}
async function get(path, maxChars) {
    let res;
    try {
        res = await fetch(base() + path, { signal: AbortSignal.timeout(30000), headers: headers() });
    }
    catch (e) {
        throw new NetdataError(`Network error: ${e.message}`);
    }
    if (!res.ok) {
        const body = (await res.text()).slice(0, 300);
        throw new NetdataError(`HTTP ${res.status}: ${body}`);
    }
    return (await res.text()).slice(0, maxChars);
}
export function getInfo() {
    return get("/api/v1/info", 4000);
}
export function listCharts() {
    return get("/api/v1/charts", 12000);
}
export function getData(chart, points) {
    const n = Math.min(Number(points ?? 20) || 20, 100);
    return get(`/api/v1/data?chart=${encodeURIComponent(chart)}&points=${n}&format=json`, 12000);
}
// ---- muxF tools:
/**
 * A Netdata agent is only as good as the build it runs, and Netdata publishes
 * every build to Docker Hub. Both tools read that registry over the public,
 * keyless Docker registry API.
 */
const ND_HUB = "https://hub.docker.com/v2/repositories/netdata/netdata";
const ND_AUTH = "https://auth.docker.io/token?service=registry.docker.io&scope=repository:netdata/netdata:pull";
const ND_REGISTRY = "https://registry-1.docker.io/v2/netdata/netdata";
const ND_UA = { "User-Agent": "awesome-mcps/1.0", Accept: "application/json" };
const ndSize = (bytes) => {
    const n = Number(bytes);
    if (!Number.isFinite(n) || n <= 0)
        return "size not reported";
    if (n >= 1e9)
        return `${(n / 1e9).toFixed(2)} GB`;
    if (n >= 1e6)
        return `${(n / 1e6).toFixed(1)} MB`;
    if (n >= 1e3)
        return `${(n / 1e3).toFixed(1)} kB`;
    return `${n} B`;
};
const ndAge = (stamp) => {
    const t = Date.parse(String(stamp ?? ""));
    if (!Number.isFinite(t))
        return "not reported";
    const hours = Math.round((Date.now() - t) / 3_600_000);
    if (hours < 48)
        return `${hours} hour(s) ago`;
    return `${Math.round(hours / 24)} day(s) ago`;
};
async function ndJson(url, what) {
    let res;
    try {
        res = await fetch(url, { headers: { ...ND_UA }, signal: AbortSignal.timeout(30000) });
    }
    catch (e) {
        throw new NetdataError(`Network error: ${e.message}`);
    }
    if (res.status === 404)
        throw new NetdataError(`Docker Hub has no ${what}.`);
    if (!res.ok)
        throw new NetdataError(`Docker Hub returned HTTP ${res.status} for ${what}.`);
    const body = (await res.text()).trim();
    if (!body)
        throw new NetdataError(`Docker Hub returned an empty body for ${what}.`);
    return JSON.parse(body);
}
/** What Netdata is publishing right now: the newest tags and how fresh each one is. */
export async function netdataReleaseCensus(args) {
    const n = Math.min(Math.max(Number(args?.limit ?? 12) || 12, 1), 30);
    const pageSize = Math.min(Math.max(Number(args?.pageSize ?? 50) || 50, 10), 100);
    const data = await ndJson(`${ND_HUB}/tags?page_size=${pageSize}&ordering=last_updated`, "the netdata/netdata tag list");
    const tags = data.results ?? [];
    if (!tags.length)
        throw new NetdataError("Docker Hub returned no tags for netdata/netdata.");
    const days = new Map();
    for (const tag of tags) {
        const day = String(tag.last_updated ?? "").slice(0, 10);
        if (day)
            days.set(day, (days.get(day) ?? 0) + 1);
    }
    const sizes = tags.map((t) => Number(t.full_size)).filter((n2) => n2 > 0);
    const newest = String(tags[0]?.last_updated ?? "");
    const lines = [
        `Docker Hub: netdata/netdata has ${data.count ?? tags.length} tag(s); ${tags.length} most recently pushed shown`,
        `  newest push ${ndAge(newest)}, oldest of these ${ndAge(tags[tags.length - 1]?.last_updated)}`,
        sizes.length ? `  image size: smallest ${ndSize(Math.min(...sizes))}, largest ${ndSize(Math.max(...sizes))}, median ${ndSize([...sizes].sort((a, b) => a - b)[Math.floor(sizes.length / 2)])}` : "  image size: not reported",
        `  tags pushed per day across these: ${[...days.entries()].sort((a, b) => b[0].localeCompare(a[0])).slice(0, 8).map(([day, count]) => `${day} (${count})`).join(", ")}`,
        "",
        "  tag               size        status     pushed            digest",
    ];
    for (const tag of tags.slice(0, n)) {
        lines.push(`  ${String(tag.name ?? "not reported").slice(0, 17).padEnd(18)}${ndSize(tag.full_size).padEnd(12)}${String(tag.tag_status ?? "not reported").padEnd(11)}${ndAge(tag.last_updated).padEnd(18)}${String(tag.digest ?? "not reported").slice(0, 26)}`);
    }
    if (tags.length > n)
        lines.push(`  ...and ${tags.length - n} older tag(s).`);
    lines.push("");
    lines.push("  Tags like edge-0 and nightly roll forward continuously; the named tags such as v2.6.4 are the releases.");
    return lines.join("\n");
}
/** Which platforms the current Netdata image actually ships, from its manifest index. */
export async function netdataPlatformAudit(args) {
    const tag = String(args?.tag ?? "latest").trim().replace(/[^A-Za-z0-9._-]/g, "") || "latest";
    let token;
    try {
        const auth = await ndJson(ND_AUTH, "an anonymous registry token");
        token = auth.token ?? "";
    }
    catch (e) {
        throw new NetdataError(`Could not get a pull token: ${e.message}`);
    }
    if (!token)
        throw new NetdataError("The registry returned no pull token.");
    let res;
    try {
        res = await fetch(`${ND_REGISTRY}/manifests/${tag}`, {
            headers: {
                ...ND_UA,
                Authorization: `Bearer ${token}`,
                Accept: "application/vnd.oci.image.index.v1+json, application/vnd.docker.distribution.manifest.list.v2+json, application/vnd.oci.image.manifest.v1+json",
            },
            signal: AbortSignal.timeout(30000),
        });
    }
    catch (e) {
        throw new NetdataError(`Network error: ${e.message}`);
    }
    if (res.status === 404)
        throw new NetdataError(`The netdata/netdata image has no tag "${tag}".`);
    if (!res.ok)
        throw new NetdataError(`The registry returned HTTP ${res.status} for tag "${tag}".`);
    const body = (await res.text()).trim();
    if (!body)
        throw new NetdataError("The registry returned an empty manifest.");
    const manifest = JSON.parse(body);
    const platforms = manifest.manifests ?? [];
    if (!platforms.length) {
        return `The netdata/netdata:${tag} manifest has no platform index (media type ${manifest.mediaType ?? "not reported"}), so it is a single-image manifest.`;
    }
    const named = platforms.filter((m) => m.platform?.os && m.platform?.os !== "unknown");
    const attestations = platforms.length - named.length;
    const arches = new Map();
    for (const item of named) {
        const key = `${item.platform?.os}/${item.platform?.architecture}${item.platform?.variant ? `/${item.platform.variant}` : ""}`;
        arches.set(key, (arches.get(key) ?? 0) + 1);
    }
    const lines = [
        `netdata/netdata:${tag} manifest index, ${platforms.length} entr(ies), media type ${manifest.mediaType ?? "not reported"}`,
        `  platforms served: ${[...arches.keys()].sort().join(", ") || "none reported"}`,
        `  ${attestations} entr(ies) carry no platform, which is how the registry ships provenance and signature attestations alongside the images`,
        "",
        "  platform        digest",
    ];
    for (const item of named.slice(0, 24)) {
        const key = `${item.platform?.os ?? "?"}/${item.platform?.architecture ?? "?"}${item.platform?.variant ? `/${item.platform.variant}` : ""}`;
        lines.push(`  ${key.padEnd(15)}${String(item.digest ?? "not reported").slice(0, 30)}`);
    }
    if (named.length > 24)
        lines.push(`  ...and ${named.length - 24} more platform(s).`);
    return lines.join("\n");
}
