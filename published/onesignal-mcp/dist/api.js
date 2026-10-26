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
const ONESIGNAL_SDKS = ["onesignal-node", "react-native-onesignal", "onesignal-cordova-plugin"];
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
