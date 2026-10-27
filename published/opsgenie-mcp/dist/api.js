export class OpsgenieError extends Error {
    constructor(message) {
        super(message);
        this.name = "OpsgenieError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
function headers() {
    const k = process.env.OPSGENIE_API_KEY;
    if (!k)
        throw new OpsgenieError("Set OPSGENIE_API_KEY (free Opsgenie tier).");
    return { ...UA, Accept: "application/json", Authorization: `GenieKey ${k}` };
}
async function get(path) {
    let res;
    try {
        res = await fetch("https://api.opsgenie.com/v2" + path, { signal: AbortSignal.timeout(30000), headers: headers() });
    }
    catch (e) {
        throw new OpsgenieError(`Network error: ${e.message}`);
    }
    if (!res.ok) {
        const body = (await res.text()).slice(0, 300);
        throw new OpsgenieError(`HTTP ${res.status}: ${body}`);
    }
    return res.text();
}
export function listAlerts(limit) {
    const n = Math.min(Number(limit ?? 20) || 20, 100);
    return get(`/alerts?limit=${n}`);
}
export function getAlert(alertId) {
    return get(`/alerts/${encodeURIComponent(alertId)}`);
}
export function listOnCalls() {
    return get("/on-calls");
}
// ---- muxG tools:
const OPSGENIE_STATUS = "https://status.opsgenie.com/api/v2";
const OPSGENIE_LIST_CAP = 10;
async function opsgenieJson(url) {
    const res = await fetch(url, { headers: { "User-Agent": "awesome-mcp/1.0", Accept: "application/json" }, signal: AbortSignal.timeout(40000) });
    if (res.status === 429)
        throw new OpsgenieError("The status page is rate limiting this IP. Wait a moment and try again.");
    if (!res.ok)
        throw new OpsgenieError(`Status page returned ${res.status}`);
    return (await res.json());
}
function opsgenieBound(value, min, max, fallback) {
    const n = Number(value);
    if (!Number.isFinite(n))
        return fallback;
    return Math.max(min, Math.min(Math.floor(n), max));
}
function opsgenieMedian(values) {
    if (!values.length)
        return 0;
    const s = [...values].sort((a, b) => a - b);
    const mid = Math.floor(s.length / 2);
    return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}
/**
 * Work out who actually gets woken up by an escalation policy, accounting for
 * each responder's working hours. A policy that pages a team with nobody on
 * shift is a coverage gap, and that is the point of this tool.
 */
export async function escalationTimeline(args) {
    const when = Date.parse(String(args?.alert_time ?? ""));
    if (!Number.isFinite(when))
        throw new OpsgenieError("alert_time must be an ISO 8601 timestamp, for example 2026-09-28T03:15:00Z.");
    const steps = (args?.steps ?? []).slice(0, 8);
    if (!steps.length)
        throw new OpsgenieError("steps is empty. Give at least one escalation step, for example { \"after_minutes\": 0, \"targets\": [\"primary\"] }.");
    const responders = (args?.responders ?? []).slice(0, 24);
    const repeats = opsgenieBound(args?.repeats, 1, 5, 1);
    const onShift = (r, at) => {
        const local = new Date(at.getTime() + r.offset_hours * 3600000);
        const hour = local.getUTCHours();
        const start = Math.max(0, Math.min(23, Number(r.start_hour ?? 0)));
        const end = Math.max(0, Math.min(24, Number(r.end_hour ?? 24)));
        return start <= end ? hour >= start && hour < end : hour >= start || hour < end;
    };
    const localHour = (r, at) => {
        const local = new Date(at.getTime() + r.offset_hours * 3600000);
        return `${String(local.getUTCHours()).padStart(2, "0")}:${String(local.getUTCMinutes()).padStart(2, "0")}`;
    };
    const lines = [
        "Escalation timeline, computed locally from the policy and roster you supplied",
        `Alert raised at ${new Date(when).toISOString().replace(".000Z", "Z")}, ${steps.length} escalation step(s) x${repeats} repeat(s), ${responders.length} responder(s)`,
    ];
    if (!responders.length) {
        lines.push("With no roster supplied this is just a restatement of the policy; supply responders with their UTC offsets and working hours to get the useful answer.", "");
    }
    let firstOnShiftAt = null;
    let firstStepOnShift = 0;
    const gaps = [];
    for (let rep = 0; rep < repeats; rep += 1) {
        for (const [i, step] of steps.entries()) {
            const at = new Date(when + (step.after_minutes + rep * (steps[steps.length - 1]?.after_minutes ?? 0)) * 60000);
            const targets = step.targets.filter(Boolean);
            const onCall = responders.filter((r) => targets.includes(r.name) && onShift(r, at));
            const offCall = responders.filter((r) => targets.includes(r.name) && !onShift(r, at));
            const tag = rep === 0 ? `step ${i + 1}` : `step ${i + 1}, repeat ${rep + 1}`;
            if (firstOnShiftAt === null && onCall.length)
                firstOnShiftAt = at.getTime();
            if (i === 0 && rep === 0)
                firstStepOnShift = onCall.length;
            lines.push(`  ${at.toISOString().replace(".000Z", "Z")}  ${tag} (+${step.after_minutes} min) targets ${targets.join(", ") || "(none named)"}`, onCall.length
                ? `    on shift: ${onCall.map((r) => `${r.name} (local ${localHour(r, at)})`).join(", ")}`
                : responders.length
                    ? `    NOBODY on shift: ${offCall.length ? `${offCall.map((r) => `${r.name} (local ${localHour(r, at)}, outside ${r.start_hour}:00-${r.end_hour}:00)`).join(", ")}` : "no responder in the roster is named at this step"}`
                    : "    (roster empty, cannot say who is available)");
            if (!onCall.length && offCall.length && responders.length) {
                gaps.push(`${tag} at ${at.toISOString().replace(".000Z", "Z")} reaches only ${offCall.map((r) => r.name).join(", ")}, all outside working hours`);
            }
            if (responders.length && !onCall.length && !offCall.length) {
                gaps.push(`${tag} names ${targets.join(", ")}, who are not in the roster at all`);
            }
        }
    }
    if (firstOnShiftAt !== null && firstOnShiftAt > when) {
        lines.push("", `First moment a responder is genuinely on shift: ${new Date(firstOnShiftAt).toISOString().replace(".000Z", "Z")}, ${Math.round((firstOnShiftAt - when) / 60000)} minute(s) after the alert.`);
    }
    else if (responders.length && firstStepOnShift === 0) {
        // Nobody in the roster is working, so work forward to when that stops being true.
        let nextOnShift = null;
        for (let minutes = 15; minutes <= 24 * 60; minutes += 15) {
            const probe = new Date(when + minutes * 60000);
            if (responders.some((r) => onShift(r, probe))) {
                nextOnShift = probe.getTime();
                break;
            }
        }
        lines.push("", nextOnShift
            ? `Nobody is on shift at the first step, so this alert waits for the roster rather than waking anyone: the next shift starts at ${new Date(nextOnShift).toISOString().replace(".000Z", "Z")}, ${Math.round((nextOnShift - when) / 60000)} minute(s) after the alert. Anyone the policy reaches before then is being paged out of hours.`
            : "Nobody in this roster is ever on shift at these hours, so the policy will always page out of hours. Check the working hours and UTC offsets you supplied.");
    }
    else if (responders.length) {
        lines.push("", "Somebody is on shift at the first escalation step, so the alert is deliverable without waking anyone.");
    }
    lines.push("", gaps.length ? "Coverage gaps found:" : "No coverage gap in the steps you supplied.");
    for (const g of gaps.slice(0, 12))
        lines.push(`  - ${g}`);
    if (gaps.length > 12)
        lines.push(`  ... and ${gaps.length - 12} more`);
    lines.push("", "This checks the roster against working hours only. It cannot know about leave, on-call swaps, secondary schedules, whether a target is a team rather than a person, or whether the paging integration can reach that channel at all, so treat a clean result as necessary rather than sufficient.");
    return lines.join("\n");
}
/** How Opsgenie's own platform has been behaving, per region and product area. */
export async function platformReliability(_args) {
    const summary = await opsgenieJson(`${OPSGENIE_STATUS}/summary.json`);
    const components = summary.components ?? [];
    const byStatus = new Map();
    for (const c of components)
        byStatus.set(c.status ?? "unknown", (byStatus.get(c.status ?? "unknown") ?? 0) + 1);
    const down = components.filter((c) => c.status && c.status !== "operational");
    const groups = new Map();
    for (const c of components) {
        if (!c.group)
            continue;
        groups.set(c.name ?? "?", (groups.get(c.name ?? "?") ?? 0) + 1);
    }
    return [
        `Opsgenie platform status: ${summary.status?.description ?? "not reported"} (indicator ${summary.status?.indicator ?? "?"})`,
        `${components.length} component(s) tracked: ${[...byStatus.entries()].map(([k, v]) => `${k} ${v}`).join(", ")}`,
        "",
        down.length ? "Not operational right now:" : "Every tracked component is operational.",
        ...down.map((c) => `  ${c.name ?? "?"} — ${c.status}${c.description ? `: ${c.description}` : ""}`),
        "",
        "Regions and product areas, by how many components sit under them:",
        ...[...groups.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `  ${String(n).padStart(3)}  ${k}`),
        "",
        "The status page tracks a separate component per region per product, so a single component going red is usually one region, not the whole platform. Read the component list before assuming a total outage.",
    ].filter(Boolean).join("\n");
}
/** The incident history as operational numbers, not a list to scroll. */
export async function incidentResponseStats(args) {
    const limit = opsgenieBound(args?.limit, 1, OPSGENIE_LIST_CAP, 6);
    const doc = await opsgenieJson(`${OPSGENIE_STATUS}/incidents.json`);
    const rows = doc.incidents ?? [];
    if (!rows.length)
        throw new OpsgenieError("The status page returned no incidents to analyse.");
    const durations = rows
        .filter((r) => r.created_at && r.resolved_at)
        .map((r) => ({
        r,
        hours: (Date.parse(r.resolved_at) - Date.parse(r.created_at)) / 3600000,
    }));
    const byImpact = new Map();
    const byStatus = new Map();
    const byHour = new Map();
    const unnotified = rows.filter((r) => r.incident_updates?.length === 0).length;
    for (const r of rows) {
        byImpact.set(r.impact ?? "unknown", (byImpact.get(r.impact ?? "unknown") ?? 0) + 1);
        byStatus.set(r.status ?? "unknown", (byStatus.get(r.status ?? "unknown") ?? 0) + 1);
        if (r.created_at) {
            const h = new Date(r.created_at).getUTCHours();
            byHour.set(h, (byHour.get(h) ?? 0) + 1);
        }
    }
    const sorted = [...durations].sort((a, b) => b.hours - a.hours);
    const open = rows.filter((r) => r.status !== "resolved");
    const overnightShare = [...byHour.entries()].filter(([h]) => h >= 22 || h < 6).reduce((s, [, n]) => s + n, 0);
    return [
        "Opsgenie incident history, aggregated",
        `${rows.length} incident(s) on record, ${open.length} not resolved`,
        `By impact: ${[...byImpact.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(", ")}`,
        `By status: ${[...byStatus.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(", ")}`,
        durations.length
            ? `Time to resolve: median ${opsgenieMedian(durations.map((d) => d.hours)).toFixed(1)} hours, mean ${(durations.reduce((s, d) => s + d.hours, 0) / durations.length).toFixed(1)} hours, longest ${sorted[0].hours.toFixed(1)} hours`
            : "No incident carries both a start and an end time.",
        `${unnotified} incident(s) were published with no status update at all.`,
        "",
        "When incidents start, by UTC hour:",
        ...[...byHour.entries()].sort((a, b) => a[0] - b[0]).map(([h, n]) => `  ${String(h).padStart(2, "0")}:00  ${"#".repeat(Math.min(40, n))} ${n}`),
        "",
        `Share starting between 22:00 and 06:00 UTC: ${rows.length ? ((overnightShare / rows.length) * 100).toFixed(0) : "0"}%`,
        "",
        "Longest incidents:",
        ...sorted.slice(0, limit).map((d) => {
            const last = d.r.incident_updates?.[d.r.incident_updates.length - 1]?.body?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
            return [
                `  ${d.hours.toFixed(1)} h  [${d.r.impact ?? "?"}] ${d.r.name ?? "(unnamed)"}`,
                `    ${String(d.r.created_at ?? "?").slice(0, 16).replace("T", " ")} to ${String(d.r.resolved_at ?? "?").slice(0, 16).replace("T", " ")}`,
                last ? `    closing note: ${last.slice(0, 180)}` : "",
            ].filter(Boolean).join("\n");
        }),
        "",
        "This is one vendor's own incident record, so it describes the paging platform, not the customers who depend on it. A short incident here can still have been a long outage for the teams it paged.",
    ].filter(Boolean).join("\n");
}
