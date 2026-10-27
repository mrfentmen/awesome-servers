/**
 * Wise API client. Requires WISE_API_TOKEN.
 * Create a free token in your Wise account (Settings > API tokens).
 * Docs: https://docs.wise.com/api-docs/
 */
const BASE = "https://api.wise.com";
export class WiseError extends Error {
}
function token() {
    const t = process.env.WISE_API_TOKEN;
    if (!t)
        throw new WiseError("Set WISE_API_TOKEN first (free in your Wise account settings).");
    return t;
}
async function getJson(path) {
    const res = await fetch(`${BASE}${path}`, {
        headers: { "User-Agent": "wise-mcp/1.0", Accept: "application/json", Authorization: `Bearer ${token()}` },
        signal: AbortSignal.timeout(20000),
    });
    if (res.status === 401 || res.status === 403)
        throw new WiseError("Wise rejected the token (401/403). Check WISE_API_TOKEN.");
    if (res.status === 404)
        throw new WiseError("Not found.");
    if (!res.ok)
        throw new WiseError(`Wise error ${res.status}`);
    return (await res.json());
}
export async function listProfiles() {
    const rows = await getJson("/v2/profiles");
    return rows.map((p) => ({
        id: Number(p.id),
        type: p.type,
        name: p.details ? String(p.details.firstName ?? p.details.name ?? p.details.businessName ?? "") : undefined,
    }));
}
export async function getBalances(profileId) {
    if (!/^\d+$/.test(profileId.trim()))
        throw new WiseError(`Profile id must be numeric, got "${profileId}".`);
    const data = await getJson(`/v4/profiles/${profileId.trim()}/balances?types=STANDARD`);
    return data.flatMap((b) => (Array.isArray(b.balances) ? b.balances : []).map((x) => ({
        currency: x.currency,
        amount: typeof x.amount?.value === "number" ? x.amount.value : undefined,
    })));
}
export async function exchangeRate(from, to) {
    const data = await getJson(`/v1/rates?source=${encodeURIComponent(from.trim().toUpperCase())}&target=${encodeURIComponent(to.trim().toUpperCase())}`);
    const rows = Array.isArray(data) ? data : [];
    const rate = rows.length > 0 ? Number(rows[0].rate) : NaN;
    if (!isFinite(rate))
        throw new WiseError(`No rate for ${from} to ${to}.`);
    return rate;
}
// ---- muxH tools:
// The three tools above call Wise's API with a personal token and report the
// caller's own profiles, balances and a live exchange rate. These two need no
// token: they read Wise's public status record, which is the thing to read when a
// transfer, a rate or a card is not behaving and the question is whether Wise or
// the caller is at fault.
const WI_UA = "mcfentmen-wise-mcp/1.2 (https://github.com/mcfentmen/wise-mcp)";
const WI_STATUS = "https://status.wise.com/api/v2";
async function wiGet(path) {
    let res;
    try {
        res = await fetch(`${WI_STATUS}/${path}`, { headers: { "User-Agent": WI_UA, Accept: "application/json" }, signal: AbortSignal.timeout(25000) });
    }
    catch (e) {
        throw new Error(`Could not reach Wise's status service: ${e.message}`);
    }
    if (!res.ok)
        throw new Error(`Wise's status service returned HTTP ${res.status} for ${path}.`);
    return (await res.json());
}
/** Statuspage component names here carry an emoji, which is stripped for reading. */
const wiLabel = (raw) => String(raw ?? "unnamed").replace(/\p{Extended_Pictographic}/gu, "").replace(/^\s+|\s+$/g, "").replace(/\s{2,}/g, " ");
const wiMinutes = (from, to) => {
    if (!to)
        return null;
    const a = Date.parse(String(from ?? ""));
    const b = Date.parse(String(to));
    if (!Number.isFinite(a) || !Number.isFinite(b) || b < a)
        return null;
    return Math.round((b - a) / 60000);
};
const wiSpan = (m) => (m < 60 ? `${m} min` : m < 1440 ? `${(m / 60).toFixed(1)} h` : `${(m / 1440).toFixed(1)} days`);
const wiClean = (raw) => String(raw ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
const wiMedian = (values) => {
    if (!values.length)
        return null;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
};
const wiComponentsOf = (incident) => (incident.components ?? []).map((c) => wiLabel(c.name)).filter(Boolean);
const wiLatestNote = (incident) => {
    const updates = Array.isArray(incident.incident_updates) ? incident.incident_updates : [];
    const latest = updates.find((u) => u?.body) ?? updates[0];
    return latest?.body ? wiClean(latest.body).slice(0, 160) : "no note published";
};
/**
 * The incident record read as a reliability history: how often each part fails,
 * how long it takes to recover, and whether it is getting better. Statuspage
 * keeps only what Wise chose to publish, which is the honest limit of this.
 */
export async function incidentHistory(args) {
    const area = String(args?.area ?? "").trim();
    const limit = Math.round(Math.min(Math.max(Number(args?.limit ?? 10) || 10, 1), 30));
    const body = await wiGet("incidents.json");
    const all = Array.isArray(body?.incidents) ? body.incidents : [];
    if (!all.length)
        throw new Error("Wise's status service published no incident history at all; either the account has never posted an incident or the feed is empty right now.");
    const filtered = area
        ? all.filter((i) => `${i.name ?? ""} ${wiComponentsOf(i).join(" ")}`.toLowerCase().includes(area.toLowerCase()))
        : all;
    if (!filtered.length)
        throw new Error(`No incident in Wise's published record matches "${area}". Try a component name such as payments, API or card, or omit the filter.`);
    const timed = filtered.map((i) => ({ incident: i, mins: i.resolved_at ? wiMinutes(i.created_at, i.resolved_at) : null }));
    const resolvedMins = timed.map((t) => t.mins).filter((m) => Number.isFinite(m));
    const open = filtered.filter((i) => !i.resolved_at);
    const mean = resolvedMins.length ? resolvedMins.reduce((a, b) => a + b, 0) / resolvedMins.length : null;
    const median = wiMedian(resolvedMins);
    const areaCounts = new Map();
    for (const i of filtered) {
        const parts = wiComponentsOf(i);
        for (const name of parts.length ? parts : ["unattributed"])
            areaCounts.set(name, (areaCounts.get(name) ?? 0) + 1);
    }
    const byYear = new Map();
    for (const t of timed) {
        const year = String(t.incident.created_at ?? "").slice(0, 4) || "undated";
        const entry = byYear.get(year) ?? { count: 0, mins: [] };
        entry.count += 1;
        if (Number.isFinite(t.mins))
            entry.mins.push(t.mins);
        byYear.set(year, entry);
    }
    const byImpact = new Map();
    for (const i of filtered) {
        const impact = String(i.impact ?? "not rated");
        byImpact.set(impact, (byImpact.get(impact) ?? 0) + 1);
    }
    const recent = [...filtered].sort((a, b) => String(b.created_at ?? "").localeCompare(String(a.created_at ?? "")));
    const rows = [
        `Wise incident record${area ? ` matching "${area}"` : ""} — ${filtered.length} of ${all.length} published incident(s)`,
        `  resolved         ${filtered.length - open.length}${open.length ? ` | still open ${open.length}` : " | none open"}`,
        `  time to resolve  ${mean === null ? "no resolved incident to time" : `mean ${wiSpan(Math.round(mean))} | median ${wiSpan(median)} (from ${resolvedMins.length} timed)`}`,
        `  by impact        ${[...byImpact.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(" | ")}`,
        "",
        "Product areas named by the incidents:",
        ...[...areaCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([name, n]) => `  ${String(n).padStart(4)}  ${name}`),
        "",
        "By year:",
        ...[...byYear.entries()].sort((a, b) => b[0].localeCompare(a[0])).map(([year, e]) => {
            const avg = e.mins.length ? Math.round(e.mins.reduce((a, b) => a + b, 0) / e.mins.length) : null;
            return `  ${year}  ${String(e.count).padStart(4)} incident(s)${avg === null ? "" : `, mean resolution ${wiSpan(avg)}`}`;
        }),
        "",
        `Most recent (top ${Math.min(limit, recent.length)}):`,
        ...recent.slice(0, limit).map((i) => {
            const mins = i.resolved_at ? wiMinutes(i.created_at, i.resolved_at) : null;
            const state = i.resolved_at ? `resolved in ${Number.isFinite(mins) ? wiSpan(mins) : "unknown time"}` : `still ${i.status ?? "open"}`;
            const parts = wiComponentsOf(i);
            return `  ${String(i.created_at ?? "").slice(0, 10)}  ${(i.name ?? "untitled").slice(0, 64)} — ${state}, impact ${i.impact ?? "not rated"}${parts.length ? ` | ${parts.join(", ")}` : ""}\n      last note: ${wiLatestNote(i)}`;
        }),
        "",
        "note: this is only what Wise published on its status page. Incidents below its own reporting threshold never appear, so a quiet record is a claim about reporting as much as about reliability, and resolution time measures when Wise called it resolved, not when every customer was whole.",
    ];
    return rows.join("\n");
}
/**
 * Which parts of Wise are working right now, and which have a declared fault.
 * Every component is listed with its own state, because a transfer working while
 * the card does not is a specific and common problem that an overall indicator
 * would hide.
 */
export async function serviceHealth(args) {
    const limit = Math.min(Math.max(Number(args?.limit ?? 10) || 10, 1), 40);
    const [summary, incidents] = await Promise.all([wiGet("summary.json"), wiGet("incidents.json")]);
    const components = summary.components ?? [];
    const all = incidents.incidents ?? [];
    if (!components.length && !summary.status)
        throw new Error("Wise's status service returned neither a status nor any components.");
    const stateOf = new Map(components.map((c) => [wiLabel(c.name), c.status ?? "not reported"]));
    const hits = new Map();
    for (const incident of all) {
        const span = wiMinutes(incident.created_at, incident.resolved_at ?? undefined);
        for (const component of incident.components ?? []) {
            const name = wiLabel(component.name);
            const entry = hits.get(name) ?? { count: 0, minutes: [], worst: null, worstImpact: "not reported" };
            entry.count += 1;
            if (span !== null)
                entry.minutes.push(span);
            if (incident.impact === "critical" || incident.impact === "major") {
                entry.worst = incident.name ?? "untitled";
                entry.worstImpact = incident.impact ?? "not reported";
            }
            hits.set(name, entry);
        }
    }
    const maintenance = summary.scheduled_maintenances ?? [];
    const open = all.filter((i) => i.status !== "resolved" && i.status !== "completed");
    const down = components.filter((c) => c.status && c.status !== "operational");
    return [
        `Wise service health, from the public status record`,
        `  overall: ${String(summary.status?.indicator ?? "not reported").toUpperCase()} — ${summary.status?.description ?? "not reported"}`,
        `  page last updated ${summary.page?.updated_at ?? "not reported"} (${summary.page?.time_zone ?? "timezone not reported"})`,
        `  ${components.length} component(s), ${down.length} not operational | ${all.length} published incident(s)${open.length ? `, ${open.length} still open` : ", all resolved"}`,
        maintenance.length ? `  ${maintenance.length} scheduled maintenance window(s) published` : "  no scheduled maintenance published",
        "",
        `Components${down.length ? ", unhealthy first" : ""}:`,
        ...[...components]
            .sort((a, b) => Number(String(a.status) !== "operational") - Number(String(b.status) !== "operational"))
            .slice(0, limit)
            .map((c) => {
            const name = wiLabel(c.name);
            const hit = hits.get(name);
            const mean = hit?.minutes.length ? Math.round(hit.minutes.reduce((a, b) => a + b, 0) / hit.minutes.length) : null;
            return (`  ${name.slice(0, 26).padEnd(26)}${String(c.status ?? "not reported").padEnd(14)}` +
                `${String(hit?.count ?? 0).padStart(3)} incident(s)${mean !== null ? `  mean ${wiSpan(mean).padStart(9)}` : ""}` +
                `${hit?.worst ? `  worst: ${wiClean(hit.worst).slice(0, 44)}` : ""}`);
        }),
        ...(components.length > limit ? [`  (+${components.length - limit} further component(s) not shown)`] : []),
        "",
        ...(open.length
            ? ["Open incidents:"]
            : ["Open incidents: none in the published record."]),
        ...open.slice(0, 5).map((i) => `  - ${i.name ?? "untitled"} (${i.status ?? "?"}, impact ${i.impact ?? "not reported"}) since ${String(i.created_at ?? "?").slice(0, 16).replace("T", " ")}` +
            `${(i.components ?? []).length ? ` | ${(i.components ?? []).map((c) => wiLabel(c.name)).join(", ")}` : ""}`),
        ...(maintenance.length
            ? [
                "",
                "Scheduled:",
                ...maintenance.slice(0, 4).map((m) => `  - ${m.name ?? "untitled"} (${m.status ?? "?"}, impact ${m.impact ?? "not reported"})` +
                    `${m.scheduled_for ? ` ${String(m.scheduled_for).slice(0, 16).replace("T", " ")} to ${String(m.scheduled_until ?? "?").slice(0, 16).replace("T", " ")}` : ""}`),
            ]
            : []),
        "",
        "A component marked operational means Wise is not currently reporting a fault against it, which is not the same as a transfer having gone through; Wise publishes only what clears its own reporting threshold, so an issue that never reaches that bar never appears here. Impact ratings are Wise's own and 'none' is a real value meaning a fault with no measured customer effect.",
    ].join("\n");
}
