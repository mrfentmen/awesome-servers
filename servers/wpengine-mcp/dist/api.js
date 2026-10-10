export class WpengineError extends Error {
    constructor(message) {
        super(message);
        this.name = "WpengineError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
function envStrict(name) {
    const v = process.env[name];
    if (!v)
        throw new WpengineError(`Set the ${name} environment variable.`);
    return v;
}
async function authHeaders() {
    const u = envStrict("WPENGINE_USERNAME");
    const p = envStrict("WPENGINE_PASSWORD");
    return { Authorization: "Basic " + Buffer.from(`${u}:${p}`).toString("base64") };
}
function pretty(data) {
    const t = typeof data === "string" ? data : JSON.stringify(data, null, 2);
    return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t;
}
async function req(url, init = {}) {
    const res = await fetch(url, { headers: { ...UA, ...(await authHeaders()), ...(init.headers ?? {}) }, ...init });
    const ct = res.headers.get("content-type") ?? "";
    const data = ct.includes("json") ? await res.json() : await res.text();
    if (!res.ok) {
        const detail = typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300);
        throw new WpengineError(`HTTP ${res.status}: ${detail}`);
    }
    return data;
}
export async function listInstalls() {
    let url = `https://api.wpengineapi.com/v1/installs`;
    const data = await req(url);
    return pretty(data);
}
export async function getInstall(installId) {
    let url = `https://api.wpengineapi.com/v1/installs/${encodeURIComponent(String(installId))}`;
    const data = await req(url);
    return pretty(data);
}
export async function listSites() {
    let url = `https://api.wpengineapi.com/v1/sites`;
    const data = await req(url);
    return pretty(data);
}
// ---- muxB tools:
const WPE_STATUS = "https://wpenginestatus.com/api";
async function wpeGet(path) {
    const res = await fetch(`${WPE_STATUS}/${path}`, {
        headers: { "User-Agent": "wpengine-mcp/1.0", Accept: "application/json" },
        signal: AbortSignal.timeout(20000),
    });
    if (res.status === 404)
        throw new WpengineError(`WP Engine status page has no "${path}".`);
    if (!res.ok)
        throw new WpengineError(`WP Engine status page returned ${res.status} for ${path}.`);
    return await res.json();
}
function wpePlain(html) {
    return html
        .replace(/<br\s*\/?>/gi, " ")
        .replace(/<[^>]+>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/\s+/g, " ")
        .trim();
}
function wpeWhen(unix, now) {
    if (!unix)
        return "not reported";
    const stamp = new Date(unix * 1000);
    const delta = unix - now;
    const ago = Math.abs(delta);
    const unit = ago < 3600 ? `${Math.round(ago / 60)} min` : ago < 86400 ? `${(ago / 3600).toFixed(1)} h` : `${(ago / 86400).toFixed(1)} days`;
    const rel = delta >= 0 ? `in ${unit}` : `${unit} ago`;
    return `${stamp.toISOString().replace("T", " ").slice(0, 16)} UTC (${rel})`;
}
export async function platformStatus() {
    const [config, statuses] = [
        (await wpeGet("config")),
        (await wpeGet("statuses")),
    ];
    const labels = config.name_for_statuses ?? {};
    const counters = statuses.counters ?? {};
    const groups = Array.isArray(statuses.groups) ? statuses.groups : [];
    const head = [
        config.name?.trim() ?? "WP Engine status page",
        `as of ${new Date().toISOString().replace("T", " ").slice(0, 16)} UTC (page timezone ${config.time_zone_name ?? "not reported"}).`,
        counters.all_up === true
            ? "Everything is operating normally."
            : `${counters.count_status_1 ?? 0} service(s) normal, ${counters.count_status_2 ?? 0} with performance issues, ${counters.count_status_3 ?? 0} disrupted.`,
    ];
    const body = groups.flatMap((g) => {
        const services = Array.isArray(g.services) ? g.services : [];
        if (services.length === 0)
            return [];
        return [
            `${g.group_name ?? "(unnamed group)"}`,
            ...services.map((s) => `  - ${s.service_name ?? "(unnamed)"}: ${labels[String(s.status ?? "")] ?? `status ${s.status ?? "unknown"}`}`),
        ];
    });
    return [...head, "", ...(body.length ? body : ["No service groups are published."])].join("\n");
}
export async function currentIncidents(args) {
    const now = Math.floor(Date.now() / 1000);
    const rows = (await wpeGet("incidents"));
    const all = Array.isArray(rows) ? rows : [];
    const resolvedToo = args.include_resolved === true;
    const picked = all.filter((r) => resolvedToo || (r.timestamp_end ?? 0) === 0);
    if (picked.length === 0) {
        return all.length === 0
            ? "No incidents reported. WP Engine is not currently listing any open incident."
            : `No open incidents (${all.length} resolved incident(s) held back; pass include_resolved=true to see them).`;
    }
    const out = [
        resolvedToo
            ? `${all.length} incident(s) on the WP Engine status page, newest last.`
            : `${picked.length} open incident(s) on the WP Engine status page.`,
        "",
    ];
    for (const r of picked.slice(-6)) {
        const ongoing = (r.timestamp_end ?? 0) === 0;
        out.push(`#${r.id ?? "?"} ${r.title ?? "(untitled)"}`);
        out.push(`   started ${wpeWhen(r.timestamp_start ?? 0, now)}`);
        out.push(ongoing ? "   still open" : `   resolved ${wpeWhen(r.timestamp_end ?? 0, now)}`);
        if (r.flags?.unconfirmed)
            out.push("   marked unconfirmed by WP Engine");
        try {
            const detail = (await wpeGet(`incidents/${r.id}`));
            const updates = Array.isArray(detail.updates) ? detail.updates : [];
            const latest = updates[0]?.message;
            if (latest)
                out.push(`   latest update: ${wpePlain(latest).slice(0, 300)}`);
        }
        catch {
            out.push("   latest update: not reported");
        }
        out.push("");
    }
    return out.join("\n").trimEnd();
}
export async function upcomingMaintenance() {
    const now = Math.floor(Date.now() / 1000);
    const rows = (await wpeGet("future_maintenances"));
    const all = Array.isArray(rows) ? rows : [];
    if (all.length === 0)
        return "No maintenance windows are scheduled on the WP Engine status page.";
    const out = [`${all.length} scheduled maintenance window(s) on the WP Engine status page.`, ""];
    for (const m of all.slice(0, 10)) {
        const window = `${m.timestamp_start_short_formatted ?? wpeWhen(m.timestamp_start ?? 0, now)} to ${m.timestamp_end_short_formatted ?? wpeWhen(m.timestamp_end ?? 0, now)}`;
        const hours = ((m.timestamp_end ?? 0) - (m.timestamp_start ?? 0)) / 3600;
        out.push(`#${m.id ?? "?"} ${(m.title ?? "(untitled)").trim()}`);
        out.push(`   window: ${window} (${hours > 0 ? `${hours.toFixed(1)} h` : "duration not reported"})`);
        const delta = (m.timestamp_start ?? 0) - now;
        if (delta > 0)
            out.push(`   starts in ${delta < 86400 ? `${Math.round(delta / 3600)} h` : `${(delta / 86400).toFixed(1)} days`}`);
    }
    return out.join("\n");
}
