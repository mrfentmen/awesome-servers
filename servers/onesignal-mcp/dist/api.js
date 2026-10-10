export class OneSignalError extends Error {
    constructor(message) {
        super(message);
        this.name = "OneSignalError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
const BASE = "https://api.onesignal.com";
function userHeaders() {
    const k = process.env.ONESIGNAL_USER_KEY;
    if (!k)
        throw new OneSignalError("Set ONESIGNAL_USER_KEY (free OneSignal tier).");
    return { ...UA, Accept: "application/json", Authorization: `Basic ${k}` };
}
function appHeaders() {
    const k = process.env.ONESIGNAL_APP_KEY;
    if (!k)
        throw new OneSignalError("Set ONESIGNAL_APP_KEY (OneSignal app REST API key).");
    return { ...UA, Accept: "application/json", Authorization: `Basic ${k}` };
}
async function get(path, headers) {
    let res;
    try {
        res = await fetch(BASE + path, { signal: AbortSignal.timeout(30000), headers });
    }
    catch (e) {
        throw new OneSignalError(`Network error: ${e.message}`);
    }
    if (!res.ok) {
        const body = (await res.text()).slice(0, 300);
        throw new OneSignalError(`HTTP ${res.status}: ${body}`);
    }
    return res.text();
}
export function listApps() {
    return get("/apps", userHeaders());
}
export function getApp(appId) {
    return get(`/apps/${encodeURIComponent(appId)}`, userHeaders());
}
export function listNotifications(appId, limit) {
    const n = Math.min(Number(limit ?? 10) || 10, 50);
    return get(`/notifications?app_id=${encodeURIComponent(appId)}&limit=${n}`, appHeaders());
}
// ---- muxG tools:
const ONESIGNAL_NPM = "https://registry.npmjs.org";
const ONESIGNAL_DOWNLOADS = "https://api.npmjs.org/downloads/point/last-week";
const ONESIGNAL_STATUS = "https://status.onesignal.com/api/v2";
const ONESIGNAL_SDKS = ["onesignal-node", "react-native-onesignal", "onesignal-cordova-plugin"];
const ONESIGNAL_LIST_CAP = 15;
async function onesignalJson(url, accept = "application/json") {
    const res = await fetch(url, {
        headers: { "User-Agent": "awesome-mcps/1.0", Accept: accept },
        signal: AbortSignal.timeout(45000),
    });
    if (res.status === 404)
        throw new OneSignalError(`Not found: ${url.replace(/^https:\/\//, "")}`);
    if (res.status === 429)
        throw new OneSignalError("The npm registry is rate limiting this IP. Wait a minute and try again.");
    if (!res.ok)
        throw new OneSignalError(`Returned ${res.status} for ${url.replace(/^https:\/\//, "")}`);
    return (await res.json());
}
async function onesignalWeeklyDownloads(pkg) {
    try {
        const d = await onesignalJson(`${ONESIGNAL_DOWNLOADS}/${encodeURIComponent(pkg)}`);
        return typeof d.downloads === "number" ? d.downloads : null;
    }
    catch {
        return null;
    }
}
function onesignalBound(value, min, max, fallback) {
    const n = Number(value);
    if (!Number.isFinite(n))
        return fallback;
    return Math.max(min, Math.min(Math.floor(n), max));
}
function onesignalMedian(values) {
    if (!values.length)
        return 0;
    const s = [...values].sort((a, b) => a - b);
    const mid = Math.floor(s.length / 2);
    return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}
/** Which OneSignal SDK people actually install, and how big each one is. */
export async function pushSdkPopularity(_args) {
    const docs = await Promise.all(ONESIGNAL_SDKS.map(async (pkg) => {
        const [doc, downloads] = await Promise.all([
            onesignalJson(`${ONESIGNAL_NPM}/${encodeURIComponent(pkg)}`, "application/vnd.npm.install-v1+json"),
            onesignalWeeklyDownloads(pkg),
        ]);
        return { pkg, doc, downloads };
    }));
    const rows = docs.map(({ pkg, doc, downloads }) => {
        const latest = doc["dist-tags"]?.latest;
        const versions = Object.keys(doc.versions ?? {});
        const stable = versions.filter((v) => !/-(alpha|beta|rc|next|pre|dev|canary)/.test(v));
        return { pkg, latest, versions: versions.length, stable: stable.length, downloads, description: doc.description };
    });
    const total = rows.reduce((s, r) => s + (r.downloads ?? 0), 0);
    return [
        "OneSignal SDK adoption, from the npm registry and the public download counter",
        ...rows.map((r) => [
            `${r.pkg} — ${r.latest ?? "no latest tag"}, ${r.versions} version(s) of which ${r.stable} are stable`,
            r.downloads !== null ? `  weekly downloads: ${r.downloads.toLocaleString("en-US")}${total ? ` (${((r.downloads / total) * 100).toFixed(1)}% of these three)` : ""}` : "  weekly downloads: not reported",
            r.description ? `  ${r.description.slice(0, 130)}` : "",
        ].filter(Boolean).join("\n")),
        "",
        `Combined weekly downloads across the three SDKs: ${total.toLocaleString("en-US")}`,
        "Download counts are npm's own, so a package that is also used from a lockfile, a private registry or a vendored copy will undercount. The relative share is the useful signal, not the absolute number.",
    ].join("\n");
}
/** The release train of one OneSignal SDK, with dates, tags and how often it ships. */
export async function sdkReleaseTimeline(args) {
    const pkg = String(args?.package ?? "").trim() || ONESIGNAL_SDKS[0];
    if (!ONESIGNAL_SDKS.includes(pkg)) {
        throw new OneSignalError(`"${pkg}" is not one of the tracked OneSignal SDKs: ${ONESIGNAL_SDKS.join(", ")}.`);
    }
    const limit = onesignalBound(args?.limit, 1, ONESIGNAL_LIST_CAP, 8);
    const doc = await onesignalJson(`${ONESIGNAL_NPM}/${encodeURIComponent(pkg)}`);
    const time = doc.time ?? {};
    const published = Object.entries(time)
        .filter(([k]) => k !== "created" && k !== "modified")
        .map(([version, date]) => ({ version, date }))
        .sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
    if (!published.length)
        throw new OneSignalError(`npm returned no publish dates for ${pkg}.`);
    const tags = Object.entries(doc["dist-tags"] ?? {});
    const stableTags = tags.filter(([k]) => k === "latest" || k === "next" || k === "beta");
    const prereleaseTags = tags.filter(([k, v]) => !stableTags.some(([sk]) => sk === k) && /-(alpha|beta|rc|next|pre|canary)/.test(v));
    const gaps = [];
    for (let i = 1; i < published.length; i += 1) {
        gaps.push(Math.abs((Date.parse(published[i - 1].date) - Date.parse(published[i].date)) / 86400000));
    }
    const latestManifest = doc["dist-tags"]?.latest ? doc.versions?.[doc["dist-tags"].latest] : undefined;
    const lastPublish = Date.parse(published[0].date);
    const daysSince = Math.round((Date.now() - lastPublish) / 86400000);
    return [
        `Release timeline for ${pkg}`,
        `First published: ${String(time.created ?? "not reported").slice(0, 10)}`,
        `Latest: ${doc["dist-tags"]?.latest ?? "no latest tag"}, ${daysSince} day(s) ago`,
        `Versions published: ${published.length}, median ${onesignalMedian(gaps).toFixed(1)} day(s) apart`,
        latestManifest?.engines?.node ? `Latest requires Node ${latestManifest.engines.node}` : "Node engine on the latest: not reported",
        latestManifest?.peerDependencies ? `Latest peer dependencies: ${Object.entries(latestManifest.peerDependencies).map(([k, v]) => `${k} ${v}`).join(", ")}` : "Peer dependencies on the latest: none declared",
        "",
        `Dist-tags: ${tags.map(([k, v]) => `${k} -> ${v}`).join(", ") || "none reported"}`,
        prereleaseTags.length ? `Prerelease tags still on the board: ${prereleaseTags.map(([k, v]) => `${k}=${v}`).join(", ")}` : "No prerelease tags left on the board.",
        "",
        `Most recent ${Math.min(limit, published.length)} of ${published.length}:`,
        ...published.slice(0, limit).map((p) => `  ${p.version}  ${p.date.slice(0, 10)}`),
        "",
        "A median gap of a few days with many prerelease tags means a rolling release train; a slow cadence with a single latest tag means a conservative one.",
    ].join("\n");
}
/** OneSignal's own record of its reliability, per product area, with the incident history behind it. */
export async function platformStatus(args) {
    const limit = onesignalBound(args?.limit, 1, ONESIGNAL_LIST_CAP, 8);
    const [summary, incidentDoc] = await Promise.all([
        onesignalJson(`${ONESIGNAL_STATUS}/summary.json`),
        onesignalJson(`${ONESIGNAL_STATUS}/incidents.json`),
    ]);
    const components = summary.components ?? [];
    const down = components.filter((c) => c.status && c.status !== "operational");
    const incidents = incidentDoc.incidents ?? [];
    const open = incidents.filter((i) => i.status !== "resolved");
    const resolved = incidents
        .filter((i) => i.created_at && i.resolved_at)
        .map((i) => (Date.parse(i.resolved_at) - Date.parse(i.created_at)) / 3600000);
    const byImpact = new Map();
    for (const i of incidents)
        byImpact.set(i.impact ?? "unknown", (byImpact.get(i.impact ?? "unknown") ?? 0) + 1);
    return [
        `OneSignal platform status: ${summary.status?.description ?? "not reported"} (indicator ${summary.status?.indicator ?? "?"})`,
        `Product areas tracked: ${components.length}${down.length ? `, ${down.length} not operational: ${down.map((c) => `${c.name} (${c.status})`).join(", ")}` : ", all operational"}`,
        "",
        components.map((c) => `  ${c.status === "operational" ? "ok  " : "!!  "}${c.name ?? "?"}${c.description ? ` — ${c.description}` : ""}`).join("\n"),
        "",
        `Incidents on record: ${incidents.length}, ${open.length} unresolved`,
        `By impact: ${[...byImpact.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(", ")}`,
        resolved.length ? `Time to resolve: median ${onesignalMedian(resolved).toFixed(1)} hours over ${resolved.length} resolved incidents` : "No resolved incident carries both a start and an end time.",
        "",
        `Most recent ${Math.min(limit, incidents.length)}:`,
        ...incidents.slice(0, limit).map((i) => {
            const hours = i.created_at && i.resolved_at ? (Date.parse(i.resolved_at) - Date.parse(i.created_at)) / 3600000 : null;
            const last = i.incident_updates?.[i.incident_updates.length - 1]?.body?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
            return [
                `  ${i.status === "resolved" ? "resolved" : "OPEN   "} [${i.impact ?? "?"}] ${i.name ?? "(unnamed)"}`,
                `    ${String(i.created_at ?? "?").slice(0, 16).replace("T", " ")}${hours === null ? ", no end time" : `, took ${hours.toFixed(1)} hours`}`,
                last ? `    latest: ${last.slice(0, 180)}` : "",
            ].filter(Boolean).join("\n");
        }),
    ].filter(Boolean).join("\n");
}
