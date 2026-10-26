export class VercelError extends Error {
    constructor(message) {
        super(message);
        this.name = "VercelError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
function headers() {
    const k = process.env.VERCEL_TOKEN;
    if (!k)
        throw new VercelError("Set VERCEL_TOKEN (Vercel account token).");
    return { ...UA, Accept: "application/json", Authorization: `Bearer ${k}` };
}
async function get(path) {
    let res;
    try {
        res = await fetch("https://api.vercel.com" + path, {
            headers: headers(),
            signal: AbortSignal.timeout(25000),
        });
    }
    catch (e) {
        throw new VercelError(`Network error: ${e.message}`);
    }
    if (!res.ok) {
        const body = (await res.text()).slice(0, 300);
        throw new VercelError(`HTTP ${res.status}: ${body}`);
    }
    return (await res.text()).slice(0, 12000);
}
export function listProjects(limit) {
    const n = Math.min(Number(limit ?? 10) || 10, 100);
    return get(`/v9/projects?limit=${n}`);
}
export function getProject(projectId) {
    return get(`/v9/projects/${encodeURIComponent(projectId)}`);
}
export function listDeployments(projectId, limit) {
    const n = Math.min(Number(limit ?? 10) || 10, 100);
    const q = projectId ? `&projectId=${encodeURIComponent(projectId)}` : "";
    return get(`/v6/deployments?limit=${n}${q}`);
}
export function deploymentDetails(deployId) {
    return get(`/v13/deployments/${encodeURIComponent(deployId)}`);
}
export function listAliases(limit) {
    const n = Math.min(Number(limit ?? 20) || 20, 100);
    return get(`/v4/aliases?limit=${n}`);
}
export function listDomains() {
    return get("/v5/domains?limit=50");
}
export function domainInfo(domain) {
    return get(`/v5/domains/${encodeURIComponent(domain)}`);
}
export function listTeams() {
    return get("/v2/teams?limit=20");
}
export function projectEnv(projectId) {
    return get(`/v9/projects/${encodeURIComponent(projectId)}/env`);
}
export function getAlias(alias) {
    return get(`/v4/aliases/${encodeURIComponent(alias)}`);
}
// ---- muxH tools:
// The ten tools above call Vercel's API with a personal token and report the
// caller's own projects, deployments and domains. These two need no token: they
// read Vercel's public status record, which reports the state of every region it
// publishes and every incident it has declared, and answer the questions that
// record is actually for.
const VC_STATUS = "https://www.vercel-status.com/api/v2";
const VC_UA = "mcfentmen-vercel-mcp/1.2 (contactae2000@gmail.com)";
async function vcGet(path) {
    let res;
    try {
        res = await fetch(`${VC_STATUS}/${path}`, { headers: { "User-Agent": VC_UA, Accept: "application/json" }, signal: AbortSignal.timeout(30000) });
    }
    catch (e) {
        throw new Error(`Could not reach Vercel's status service: ${e.message}`);
    }
    if (!res.ok)
        throw new Error(`Vercel's status service returned HTTP ${res.status} for ${path}.`);
    return (await res.json());
}
/** Vercel names its regions "IAD1 - Washington DC, USA", so the code and place split. */
function vcRegion(name) {
    const match = /^([A-Z]{2,4}\d?)\s*-\s*(.+)$/.exec(name.trim());
    if (!match)
        return null;
    return { code: match[1], place: match[2].trim() };
}
const vcDays = (from, to) => {
    if (!to)
        return null;
    const a = Date.parse(String(from ?? ""));
    const b = Date.parse(String(to));
    if (!Number.isFinite(a) || !Number.isFinite(b) || b < a)
        return null;
    return Math.round((b - a) / 60000);
};
const vcSpan = (minutes) => minutes < 60 ? `${minutes} min` : minutes < 1440 ? `${(minutes / 60).toFixed(1)} h` : `${(minutes / 1440).toFixed(1)} days`;
const vcClean = (raw) => String(raw ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
/**
 * Where Vercel's network actually is, and which of those places has been in
 * trouble. The status page names every region individually, so this reads the
 * region list, groups it by country, and counts how often each region has been
 * named in a declared incident. No token needed.
 */
export async function edgeFootprint(args) {
    const limit = Math.min(Math.max(Number(args?.limit ?? 20) || 20, 1), 60);
    const [summary, incidents] = await Promise.all([vcGet("summary.json"), vcGet("incidents.json")]);
    const components = summary.components ?? [];
    const all = incidents.incidents ?? [];
    if (!components.length)
        throw new Error("Vercel's status service published no components.");
    const regions = components.map((c) => c.name ?? "").map((n) => vcRegion(n)).filter((r) => r !== null);
    if (!regions.length)
        throw new Error("None of Vercel's published components name a region, so there is no footprint to report.");
    const stateOf = new Map(components.map((c) => [c.name ?? "", c.status ?? "not reported"]));
    const hits = new Map();
    const productHits = new Map();
    for (const incident of all) {
        const span = vcDays(incident.created_at, incident.resolved_at ?? undefined);
        for (const component of incident.components ?? []) {
            const name = component.name ?? "";
            if (vcRegion(name)) {
                const entry = hits.get(name) ?? { count: 0, worst: null, minutes: [] };
                entry.count += 1;
                if (span !== null)
                    entry.minutes.push(span);
                if (!entry.worst || incident.impact === "critical" || incident.impact === "major")
                    entry.worst = incident.name ?? "untitled";
                hits.set(name, entry);
            }
            else {
                productHits.set(name, (productHits.get(name) ?? 0) + 1);
            }
        }
    }
    // Country is the tail of the place string, which is how Vercel writes them.
    const countries = new Map();
    for (const region of regions) {
        const country = region.place.split(",").pop()?.trim() || region.place;
        countries.set(country, [...(countries.get(country) ?? []), region.code]);
    }
    const down = regions.filter((r) => stateOf.get(`${r.code} - ${r.place}`) !== "operational");
    const indicator = summary.status?.indicator ?? "not reported";
    return [
        `Vercel edge footprint, from the public status record`,
        `  overall status: ${String(indicator).toUpperCase()} — ${summary.status?.description ?? "not reported"}`,
        `  ${regions.length} region(s) published across ${countries.size} countr${countries.size === 1 ? "y" : "ies"} | ${down.length} not operational`,
        `  ${components.length} component(s) in total, the rest being products such as Builds and Functions`,
        all.length ? `  ${all.length} incident(s) in the published record` : "  no incidents in the published record",
        "",
        "Regions, most affected first:",
        ...regions
            .map((region) => {
            const key = `${region.code} - ${region.place}`;
            const hit = hits.get(key);
            const mean = hit?.minutes.length ? Math.round(hit.minutes.reduce((a, b) => a + b, 0) / hit.minutes.length) : null;
            return { key, region, hit, mean, state: stateOf.get(key) ?? "not reported" };
        })
            .sort((a, b) => (b.hit?.count ?? 0) - (a.hit?.count ?? 0) || a.region.code.localeCompare(b.region.code))
            .slice(0, limit)
            .map((r, i) => `  ${String(i + 1).padStart(2)}. ${r.region.code.padEnd(6)} ${r.region.place.slice(0, 30).padEnd(30)} ${String(r.state).padEnd(11)}` +
            ` ${String(r.hit?.count ?? 0).padStart(3)} incident(s)${r.mean !== null ? `  mean ${vcSpan(r.mean).padStart(9)}` : ""}`),
        "",
        "By country:",
        ...[...countries.entries()]
            .sort((a, b) => b[1].length - a[1].length)
            .map(([country, codes]) => `  ${country.padEnd(18)}${String(codes.length).padStart(3)} region(s): ${codes.join(", ")}`),
        "",
        "Most affected products, for contrast:",
        ...[...productHits.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([name, n]) => `  ${name.padEnd(28)}${String(n).padStart(3)} incident(s)`),
        "",
        "Read as: a region appearing often is usually a symptom rather than a cause, because one incident in a region often names the product that failed rather than the place, so the region column and the product column answer different questions. The list is what Vercel publishes, not its full capacity, and a region absent here is not necessarily unavailable, only unreported.",
    ].join("\n");
}
/**
 * Vercel's incident record read as a timeline: what broke, how long it lasted,
 * which products and regions it touched, what the last update said, and the
 * maintenance it has scheduled. No token needed.
 */
export async function incidentTimeline(args) {
    const impact = String(args?.impact ?? "").trim().toLowerCase();
    const limit = Math.min(Math.max(Number(args?.limit ?? 8) || 8, 1), 30);
    const [incidents, summary] = await Promise.all([vcGet("incidents.json"), vcGet("summary.json")]);
    const all = incidents.incidents ?? [];
    if (!all.length)
        throw new Error("Vercel's status service returned no incidents.");
    const pool = impact ? all.filter((i) => String(i.impact ?? "").toLowerCase() === impact) : all;
    if (!pool.length) {
        const seen = [...new Set(all.map((i) => i.impact ?? "not reported"))].sort();
        return `No incident in Vercel's ${all.length} published records has impact "${args.impact}". Impacts present: ${seen.join(", ")}.`;
    }
    const open = pool.filter((i) => i.status !== "resolved");
    const durations = pool.map((i) => vcDays(i.created_at, i.resolved_at ?? undefined)).filter((n) => n !== null);
    const impacts = new Map();
    for (const i of all)
        impacts.set(i.impact ?? "not reported", (impacts.get(i.impact ?? "not reported") ?? 0) + 1);
    const maintenance = summary.scheduled_maintenances ?? [];
    return [
        `Vercel incident record${impact ? `, impact ${impact}` : ""}`,
        `  ${pool.length} of ${all.length} published incident(s)${open.length ? `, ${open.length} still open` : ", all resolved"}`,
        `  record last updated ${summary.page?.updated_at ?? "not reported"} (${summary.page?.time_zone ?? "timezone not reported"})`,
        `  impacts across the whole record: ${[...impacts.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${n} ${k}`).join(", ")}`,
        durations.length
            ? `  resolved incidents ran a mean of ${vcSpan(Math.round(durations.reduce((a, b) => a + b, 0) / durations.length))}, longest ${vcSpan(Math.max(...durations))}, shortest ${vcSpan(Math.min(...durations))}`
            : "  no incident in this selection carries a resolution time",
        maintenance.length ? `  ${maintenance.length} scheduled maintenance window(s) published` : "  no scheduled maintenance published",
        "",
        ...pool
            .slice()
            .sort((a, b) => (String(b.created_at ?? "") < String(a.created_at ?? "") ? -1 : 1))
            .slice(0, limit)
            .map((incident) => {
            const updates = incident.incident_updates ?? [];
            const last = updates.length ? updates[updates.length - 1] : null;
            const span = vcDays(incident.created_at, incident.resolved_at ?? undefined);
            const regions = (incident.components ?? []).map((c) => c.name ?? "").map((n) => vcRegion(n)).filter((r) => r !== null);
            return [
                `  - ${incident.name ?? "untitled incident"}`,
                `    ${incident.status ?? "status not reported"} | impact ${incident.impact ?? "not reported"} | reported ${String(incident.created_at ?? "").slice(0, 16).replace("T", " ")}` +
                    (span !== null ? ` | resolved after ${vcSpan(span)}` : ` | still open${(incident.monitoring_at ?? "") ? `, monitoring since ${String(incident.monitoring_at).slice(0, 16).replace("T", " ")}` : ""}`),
                `    products: ${(incident.components ?? []).map((c) => c.name).filter((n) => n && !vcRegion(n)).join(", ") || "none named"}` +
                    (regions.length ? ` | regions: ${regions.map((r) => r.code).join(", ")}` : " | regions: none named"),
                ...(last ? [`    latest update (${last.status ?? "no status"}, ${String(last.created_at ?? "").slice(0, 16).replace("T", " ")}): ${vcClean(last.body).slice(0, 190) || "empty note"}`] : []),
                ...(incident.shortlink ? [`    ${incident.shortlink}`] : []),
            ].join("\n");
        }),
        ...(pool.length > limit ? ["", `  (+${pool.length - limit} more incident(s) not shown)`] : []),
        "",
        "This is Vercel's public status record, which it publishes only for problems it has declared. An empty result for a product means Verc never declared an incident against it, not that the product never misbehaved, and the durations are from Vercel's own timestamps rather than from affected users.",
    ].join("\n");
}
