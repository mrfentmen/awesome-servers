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
/** OneSignal's public status page, a Statuspage instance. */
const ONESIGNAL_STATUS = "https://status.onesignal.com/api/v2";
async function onesignalStatusJson(path) {
    const url = `${ONESIGNAL_STATUS}${path}`;
    const res = await fetch(url, {
        headers: { "User-Agent": "awesome-mcps/1.0", Accept: "application/json" },
        signal: AbortSignal.timeout(30000),
    });
    if (!res.ok)
        throw new OneSignalError(`The status page returned ${res.status} for ${path.replace(/^\//, "")}.`);
    return (await res.json());
}
function osDays(fromIso, toMs = Date.now()) {
    const t = Date.parse(fromIso);
    if (!Number.isFinite(t))
        return null;
    return Math.round((toMs - t) / 86400000);
}
function osDay(iso) {
    const t = Date.parse(iso ?? "");
    return Number.isFinite(t) ? new Date(t).toISOString().slice(0, 10) : "unknown";
}
function osSpan(ms) {
    if (!Number.isFinite(ms))
        return "unresolved";
    if (ms < 0)
        return "0 min (the page's own timestamps are out of order)";
    const mins = Math.round(ms / 60000);
    if (mins < 60)
        return `${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 48)
        return `${hours} h ${mins % 60} min`;
    return `${Math.round(hours / 24)} day(s)`;
}
/** Release cadence of one OneSignal SDK, read from the npm packument's own time map. */
export async function sdkReleaseTimeline(args) {
    const requested = String(args.package ?? "").trim();
    const pkg = requested || "react-native-onesignal";
    const limit = Math.min(Math.max(Number(args.limit ?? 10) || 10, 1), 30);
    const doc = await onesignalJson(`${ONESIGNAL_NPM}/${encodeURIComponent(pkg)}`);
    const time = doc.time ?? {};
    const versions = Object.keys(doc.versions ?? {});
    if (!versions.length)
        throw new OneSignalError(`${pkg} has no published versions on npm.`);
    const dated = versions
        .map((v) => ({ version: v, at: time[v] }))
        .filter((r) => typeof r.at === "string")
        .sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
    if (!dated.length)
        throw new OneSignalError(`npm published no dates for ${pkg}, so the cadence cannot be read.`);
    const first = dated[0];
    const latestTag = doc["dist-tags"]?.latest ?? null;
    const latestDated = dated[dated.length - 1];
    const gaps = [];
    for (let i = 1; i < dated.length; i++)
        gaps.push(Date.parse(dated[i].at) - Date.parse(dated[i - 1].at));
    const sortedGaps = [...gaps].sort((a, b) => a - b);
    const medianGap = sortedGaps.length
        ? sortedGaps.length % 2
            ? sortedGaps[(sortedGaps.length - 1) / 2]
            : (sortedGaps[sortedGaps.length / 2 - 1] + sortedGaps[sortedGaps.length / 2]) / 2
        : null;
    const tags = Object.entries(doc["dist-tags"] ?? {}).map(([tag, version]) => ({
        tag,
        version,
        at: time[version],
        prerelease: /-(alpha|beta|rc|next|pre|dev|canary|staging)/i.test(String(version)),
    }));
    const prereleaseTags = tags.filter((t) => t.prerelease);
    const recent = [...dated].reverse().slice(0, limit);
    const rows = [
        `${pkg} release train, from the npm registry`, 
        `  versions published     ${versions.length}`,
        `  first release          ${osDay(first.at)} (${first.version})`,
        `  latest tag             ${latestTag ?? "not set"}${latestTag && time[latestTag] ? `, published ${osDay(time[latestTag])}` : ""}`,
        `  newest version by date ${latestDated.version}, ${osDay(latestDated.at)}`,
        `  days since a release   ${osDays(latestDated.at) ?? "unknown"}`,
        medianGap !== null ? `  median gap             ${(medianGap / 86400000).toFixed(1)} day(s)` : "",
        "",
        `dist-tags (${tags.length}):`,
        ...tags.map((t) => `  ${t.tag.padEnd(14)} ${t.version}${t.at ? ` — ${osDay(t.at)}` : ""}${t.prerelease ? " (prerelease)" : ""}`),
        prereleaseTags.length
            ? `  ${prereleaseTags.length} tag(s) still point at a prerelease: ${prereleaseTags.map((t) => t.tag).join(", ")}`
            : "  No tag points at a prerelease.",
        "",
        `Most recent ${recent.length} version(s) by publish date:`,
        ...recent.map((r) => `  ${osDay(r.at)}  ${r.version}`),
        "",
        "Dates are npm's own publish timestamps. A version republished under a new tag keeps its original date.",
    ].filter(Boolean);
    return rows.join("\n");
}
/** OneSignal's own reliability record: current state per product area plus incident history. */
export async function platformStatus(args) {
    const limit = Math.min(Math.max(Number(args.limit ?? 10) || 10, 1), 25);
    const [summary, history] = await Promise.all([
        onesignalStatusJson("/summary.json"),
        onesignalStatusJson("/incidents.json").catch(() => ({ incidents: [] })),
    ]);
    const state = summary.status ?? {};
    const components = Array.isArray(summary.components) ? summary.components : [];
    const incidents = Array.isArray(history.incidents) ? history.incidents : Array.isArray(summary.incidents) ? summary.incidents : [];
    const ranked = [...incidents]
        .sort((a, b) => Date.parse(b.created_at ?? 0) - Date.parse(a.created_at ?? 0))
        .slice(0, limit);
    const rows = [
        `OneSignal platform status — ${String(state.description ?? "unknown")} (indicator: ${String(state.indicator ?? "none")})`,
        "",
        `Product areas (${components.length}):`,
        ...components.map((c) => `  ${String(c.status ?? "unknown").padEnd(12)} ${c.name}${c.group ? ` — ${c.group}` : ""}`),
    ];
    if (!components.length)
        rows.push("  The status page published no components.");
    rows.push("", `Incident history (${incidents.length} on record, latest ${ranked.length} shown):`);
    if (!ranked.length)
        rows.push("  No incidents on record.");
    for (const inc of ranked) {
        const resolved = inc.resolved_at ?? (inc.status === "resolved" ? inc.updated_at : null);
        const createdMs = Date.parse(inc.created_at ?? "");
        const resolvedMs = resolved ? Date.parse(resolved) : NaN;
        const took = Number.isFinite(createdMs) && Number.isFinite(resolvedMs) ? resolvedMs - createdMs : NaN;
        const updates = Array.isArray(inc.incident_updates) ? inc.incident_updates : [];
        const latest = updates[0] ?? null;
        rows.push(`  ${osDay(inc.created_at)}  ${inc.name}`);
        const duration = !resolved ? "still open" : Number.isFinite(took) ? `resolved in ${osSpan(took)}` : "resolved, duration not published";
        rows.push(`    impact ${String(inc.impact ?? "none")} | status ${String(inc.status ?? "unknown")} | ${duration}${inc.shortlink ? ` | ${inc.shortlink}` : ""}`);
        if (latest)
            rows.push(`    latest update (${osDay(latest.created_at)}): ${String(latest.body ?? "").replace(/\s+/g, " ").slice(0, 240)}`);
    }
    rows.push("", "Read from status.onesignal.com, the vendor's own Statuspage. Incident text is theirs, not a measurement of this server.");
    return rows.join("\n");
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
