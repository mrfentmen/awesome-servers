export class BlubrryError extends Error {
    constructor(message) {
        super(message);
        this.name = "BlubrryError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
const BASE = "https://api.blubrry.com/2";
function envStrict(name) {
    const v = process.env[name];
    if (!v)
        throw new BlubrryError(`Set the ${name} environment variable.`);
    return v;
}
function pretty(data) {
    const t = typeof data === "string" ? data : JSON.stringify(data, null, 2);
    return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t;
}
async function req(path) {
    const res = await fetch(BASE + path, {
        signal: AbortSignal.timeout(30000),
        headers: { ...UA, Authorization: "Bearer " + envStrict("BLUBRRY_ACCESS_TOKEN") },
    });
    const ct = res.headers.get("content-type") ?? "";
    const data = ct.includes("json") ? await res.json() : await res.text();
    if (!res.ok) {
        const detail = typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300);
        throw new BlubrryError(`HTTP ${res.status}: ${detail}`);
    }
    return pretty(data);
}
export function listShows() {
    return req("/media/index.json");
}
export function listShowMedia(keyword) {
    return req(`/media/${encodeURIComponent(keyword)}/index.json`);
}
export function getShowStatsSummary(keyword) {
    return req(`/stats/${encodeURIComponent(keyword)}/summary.json`);
}
export function getShowEpisodeStats(keyword) {
    return req(`/stats/${encodeURIComponent(keyword)}/show-episodes/`);
}
export function getShowStatsTotals(keyword) {
    return req(`/stats/${encodeURIComponent(keyword)}/totals.json`);
}
// ---- muxD tools:
/** Same request as req(), but parsed, so a caller can roll the response up itself. */
async function reqJson(path) {
    const res = await fetch(BASE + path, {
        signal: AbortSignal.timeout(30000),
        headers: { ...UA, Accept: "application/json", Authorization: "Bearer " + envStrict("BLUBRRY_ACCESS_TOKEN") },
    });
    const ct = res.headers.get("content-type") ?? "";
    const data = ct.includes("json") ? await res.json() : await res.text();
    if (!res.ok) {
        const detail = typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300);
        throw new BlubrryError(`HTTP ${res.status}: ${detail}`);
    }
    return data;
}
/**
 * GET /stats/index.json - "List shows with statistics access".
 * Body: array of Hosted{program_title, program_keyword, program_id,
 *                        podcast_id, stats_program_id, feed_url}
 */
export function listStatsShows(_args = {}) {
    return reqJson("/stats/index.json").then((data) => {
        const rows = Array.isArray(data) ? data : [];
        if (!rows.length)
            throw new BlubrryError("Blubrry returned no shows with statistics access for this token.");
        const lines = rows.map((h, i) => {
            const bits = [`${i + 1}. ${h.program_title ?? "(untitled program)"}`];
            if (h.program_keyword)
                bits.push(` | keyword ${h.program_keyword}`);
            if (h.program_id !== undefined)
                bits.push(` | program id ${h.program_id}`);
            if (h.stats_program_id !== undefined && h.stats_program_id !== h.program_id)
                bits.push(` | stats id ${h.stats_program_id}`);
            if (h.feed_url)
                bits.push(`\n   ${h.feed_url}`);
            return bits.join("");
        });
        return [`Blubrry shows with statistics access (${rows.length}):`, ...lines].join("\n");
    });
}
/**
 * GET /stats/{keyword}/countries.json
 * Body: { record_count, "<mcc>": { country_name, total }, ... }
 */
export function downloadCountries(keyword, limit) {
    const key = (keyword ?? "").trim();
    if (!key)
        throw new BlubrryError("Provide the show program keyword.");
    const n = Math.min(Math.max(Number(limit ?? 25) || 25, 1), 100);
    return reqJson(`/stats/${encodeURIComponent(key)}/countries.json`).then((data) => {
        const d = (data ?? {});
        const named = d.country_name ? [d] : [];
        const rows = Object.entries(d)
            .filter(([k]) => /^\d+$/.test(k))
            .map(([mcc, v]) => {
            const c = (v ?? {});
            return { mcc, name: c.country_name ?? "name not reported", total: Number(c.total ?? 0) };
        });
        const all = [...named.map((c) => ({ mcc: "?", name: c.country_name ?? "name not reported", total: Number(c.total ?? 0) })), ...rows];
        if (!all.length)
            throw new BlubrryError(`Blubrry returned no country breakdown for ${key}.`);
        const total = all.reduce((s, r) => s + (Number.isFinite(r.total) ? r.total : 0), 0);
        const ranked = all.filter((r) => r.total > 0).sort((a, b) => b.total - a.total);
        const shown = ranked.slice(0, n);
        const head = `Downloads by country for ${key}: ${d.record_count ?? all.length} record(s) reported, ${total.toLocaleString()} downloads in total.`;
        if (!shown.length)
            return `${head}\nNo country reported a download above zero.`;
        return [
            head,
            ...shown.map((r, i) => `  ${i + 1}. ${r.name} [MCC ${r.mcc}] — ${r.total.toLocaleString()} (${((r.total / total) * 100).toFixed(1)}%)`),
            ranked.length > n ? `  ...and ${ranked.length - n} more country/countries with downloads.` : "",
        ].filter(Boolean).join("\n");
    });
}
/**
 * GET /stats/{keyword}/apps.json   -> { record_count, "<client_class_id>": { client_name, client_class_id, total } }
 * GET /stats/{keyword}/app-types.json -> { record_count, "<class id>": { client_class_name, total } }
 * Grouped by class id because the two responses key on the same id.
 */
export function listeningApps(keyword, limit) {
    const key = (keyword ?? "").trim();
    if (!key)
        throw new BlubrryError("Provide the show program keyword.");
    const n = Math.min(Math.max(Number(limit ?? 25) || 25, 1), 100);
    return Promise.all([
        reqJson(`/stats/${encodeURIComponent(key)}/apps.json`),
        reqJson(`/stats/${encodeURIComponent(key)}/app-types.json`),
    ]).then(([appData, typeData]) => {
        const apps = (appData ?? {});
        const types = (typeData ?? {});
        const classNames = new Map();
        for (const [k, v] of Object.entries(types)) {
            if (!/^\d+$/.test(k))
                continue;
            const t = (v ?? {});
            classNames.set(k, t.client_class_name ?? "class name not reported");
        }
        const rows = Object.entries(apps)
            .filter(([k]) => /^\d+$/.test(k))
            .map(([id, v]) => {
            const a = (v ?? {});
            const classId = String(a.client_class_id ?? "");
            return {
                id,
                name: a.client_name ?? "name not reported",
                classId,
                className: classNames.get(classId) ?? (classNames.size ? "class not reported by /app-types.json" : "app types not reported"),
                total: Number(a.total ?? 0),
            };
        });
        if (!rows.length)
            throw new BlubrryError(`Blubrry returned no listening-app breakdown for ${key}.`);
        const total = rows.reduce((s, r) => s + (Number.isFinite(r.total) ? r.total : 0), 0);
        const ranked = rows.sort((a, b) => b.total - a.total);
        const byClass = new Map();
        for (const r of ranked)
            byClass.set(r.className, (byClass.get(r.className) ?? 0) + r.total);
        return [
            `Listening apps for ${key}: ${apps.record_count ?? rows.length} app record(s) reported, ${total.toLocaleString()} downloads in total.`,
            "",
            "By client class (from /app-types.json):",
            ...[...byClass.entries()].sort((a, b) => b[1] - a[1]).map(([name, n2]) => `  ${name}: ${n2.toLocaleString()} (${((n2 / total) * 100).toFixed(1)}%)`),
            "",
            `Top ${Math.min(n, ranked.length)} apps:`,
            ...ranked.slice(0, n).map((r, i) => `  ${i + 1}. ${r.name} [class ${r.classId || "?"} - ${r.className}] — ${r.total.toLocaleString()} (${((r.total / total) * 100).toFixed(1)}%)`),
            ranked.length > n ? `  ...and ${ranked.length - n} more app(s).` : "",
        ].filter(Boolean).join("\n");
    });
}
