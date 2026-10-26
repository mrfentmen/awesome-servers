export class SlackError extends Error {
    constructor(message) {
        super(message);
        this.name = "SlackError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
function headers() {
    const k = process.env.SLACK_BOT_TOKEN;
    if (!k)
        throw new SlackError("Set SLACK_BOT_TOKEN (Slack app bot token).");
    return { ...UA, Accept: "application/json", Authorization: `Bearer ${k}` };
}
async function get(path) {
    let res;
    try {
        res = await fetch("https://slack.com/api" + path, {
            headers: headers(),
            signal: AbortSignal.timeout(25000),
        });
    }
    catch (e) {
        throw new SlackError(`Network error: ${e.message}`);
    }
    if (!res.ok) {
        const body = (await res.text()).slice(0, 300);
        throw new SlackError(`HTTP ${res.status}: ${body}`);
    }
    return (await res.text()).slice(0, 12000);
}
async function post(method, body) {
    let res;
    try {
        res = await fetch("https://slack.com/api/" + method, {
            method: "POST",
            headers: { ...headers(), "Content-Type": "application/json" },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(25000),
        });
    }
    catch (e) {
        throw new SlackError(`Network error: ${e.message}`);
    }
    const text = await res.text();
    if (!res.ok)
        throw new SlackError(`HTTP ${res.status}: ${text.slice(0, 300)}`);
    return text.slice(0, 4000);
}
export function listChannels(limit) {
    const n = Math.min(Number(limit ?? 20) || 20, 200);
    return get(`/conversations.list?limit=${n}&types=public_channel,private_channel`);
}
export function getHistory(channel, limit) {
    const n = Math.min(Number(limit ?? 10) || 10, 100);
    return get(`/conversations.history?channel=${encodeURIComponent(channel)}&limit=${n}`);
}
export function postMessage(channel, text) {
    return post("chat.postMessage", { channel, text });
}
export function listUsers(limit) {
    const n = Math.min(Number(limit ?? 20) || 20, 200);
    return get(`/users.list?limit=${n}`);
}
export function userInfo(user) {
    return get(`/users.info?user=${encodeURIComponent(user)}`);
}
export function channelInfo(channel) {
    return get(`/conversations.info?channel=${encodeURIComponent(channel)}`);
}
export function threadReplies(channel, ts) {
    return get(`/conversations.replies?channel=${encodeURIComponent(channel)}&ts=${encodeURIComponent(ts)}&limit=20`);
}
export function emojiList() {
    return get("/emoji.list").then((t) => t.slice(0, 4000));
}
export function pinMessage(channel, timestamp) {
    return post("pins.add", { channel, timestamp });
}
export function setTopic(channel, topic) {
    return post("conversations.setTopic", { channel, topic });
}
// ---- muxH tools:
// Every tool above talks to one workspace through a bot token. These two answer a
// different question — what Slack itself has been doing, workspace-wide — from
// Slack's own published status API, which needs no token at all.
const SLACK_STATUS = "https://status.slack.com/api/v2.0.0";
const SL_UA = "mcfentmen-slack-mcp/1.2 (https://github.com/mcfentmen/slack-mcp)";
async function statusGet(path) {
    let res;
    try {
        res = await fetch(`${SLACK_STATUS}/${path}`, {
            headers: { "User-Agent": SL_UA, Accept: "application/json" },
            signal: AbortSignal.timeout(25000),
        });
    }
    catch (e) {
        throw new SlackError(`Could not reach Slack's status service: ${e.message}`);
    }
    if (!res.ok)
        throw new SlackError(`Slack status service returned HTTP ${res.status}.`);
    return (await res.json());
}
const stripHtml = (raw) => raw
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
const isoDay = (raw) => (raw ? raw.slice(0, 10) : "not reported");
/**
 * The published incident record for one Slack service: how often it has been
 * hit, when, how long the record runs, and what the last update said. Useful
 * before blaming an outage on a workspace's own configuration.
 */
export async function serviceIncidentHistory(args) {
    const wanted = (args.service ?? "").trim();
    if (!wanted)
        throw new SlackError("Name a Slack service, for example Messaging or Files.");
    const limit = Math.min(Math.max(Number(args.limit ?? 8) || 8, 1), 25);
    const incidents = await statusGet("history");
    if (!Array.isArray(incidents))
        throw new SlackError("Slack's history endpoint did not return a list of incidents.");
    const needle = wanted.toLowerCase();
    const hits = incidents
        .filter((i) => (i.services ?? []).some((s) => s.toLowerCase() === needle))
        .sort((a, b) => Date.parse(b.date_created ?? "") - Date.parse(a.date_created ?? ""));
    if (!hits.length) {
        const known = [...new Set(incidents.flatMap((i) => i.services ?? []))].sort();
        return `No incident in Slack's published history lists ${wanted} as an affected service. Services that do appear: ${known.join(", ")}.`;
    }
    const dates = hits.map((i) => i.date_created).filter(Boolean);
    const totalNotes = hits.reduce((sum, i) => sum + (i.notes?.length ?? 0), 0);
    const unresolved = hits.filter((i) => i.status && i.status !== "resolved").length;
    const lines = [
        `Slack incident history for ${wanted}`,
        `  ${hits.length} incident(s) in the published record, ${isoDay(dates[dates.length - 1])} to ${isoDay(dates[0])}`,
        `  ${totalNotes} status update(s) across those incidents | ${unresolved} not marked resolved`,
        "",
    ];
    hits.slice(0, limit).forEach((incident, i) => {
        const notes = incident.notes ?? [];
        const last = notes.length ? notes[notes.length - 1] : null;
        lines.push(`  ${i + 1}. ${incident.title ?? "untitled incident"}`);
        lines.push(`     ${isoDay(incident.date_created)} -> ${isoDay(incident.date_updated)} | ${incident.status ?? "status not reported"} | ${notes.length} update(s) | id ${incident.id ?? "not reported"}`);
        lines.push(`     services: ${(incident.services ?? []).join(", ") || "not reported"}`);
        if (last) {
            const body = stripHtml(last.body ?? "");
            lines.push(`     last update ${isoDay(last.date_created)}: ${body.slice(0, 180) || "empty note"}`);
        }
        if (incident.url)
            lines.push(`     ${incident.url}`);
    });
    if (hits.length > limit)
        lines.push("", `  (+${hits.length - limit} older incident(s) not shown)`);
    lines.push("", "Taken from Slack's own published status record, which covers the service rather than any one workspace. An incident missing here does not rule out a problem local to your workspace.");
    return lines.join("\n");
}
/**
 * The whole published record ranked by which service was hit most often, so a
 * workspace can see whether its own complaints fall in a service Slack already
 * knows is fragile.
 */
export async function incidentServiceRanking(args) {
    const days = Math.min(Math.max(Number(args.days ?? 180) || 180, 7), 365);
    const [now, incidents] = await Promise.all([statusGet("current"), statusGet("history")]);
    if (!Array.isArray(incidents))
        throw new SlackError("Slack's history endpoint did not return a list of incidents.");
    const cutoff = Date.now() - days * 86400000;
    const window = incidents.filter((i) => Date.parse(i.date_created ?? "") >= cutoff);
    if (!window.length) {
        return `Slack's published history holds no incident created in the last ${days} days. Overall status right now: ${now.status ?? "not reported"}.`;
    }
    const counts = new Map();
    const latest = new Map();
    for (const incident of window) {
        for (const service of incident.services ?? []) {
            counts.set(service, (counts.get(service) ?? 0) + 1);
            const held = latest.get(service);
            if (!held || Date.parse(incident.date_created ?? "") > Date.parse(held.date_created ?? "")) {
                latest.set(service, incident);
            }
        }
    }
    const dates = window.map((i) => i.date_created).filter(Boolean);
    const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    const multiService = window.filter((i) => (i.services ?? []).length > 1).length;
    const active = now.active_incidents ?? [];
    const bar = (n, max) => "#".repeat(Math.max(1, Math.round((n / max) * 24)));
    const lines = [
        `Slack incident ranking, last ${days} days`,
        `  ${window.length} incident(s) published, ${isoDay(dates[dates.length - 1])} to ${isoDay(dates[0])}`,
        `  overall status now: ${now.status ?? "not reported"} | active incident(s) now: ${active.length}`,
        `  ${multiService} incident(s) hit more than one service at once, so the count below exceeds the incident total`,
        "",
        "Service".padEnd(32) + "Incidents  Share  Most recent",
    ];
    const max = ranked[0]?.[1] ?? 1;
    for (const [service, count] of ranked) {
        const recent = latest.get(service);
        lines.push(`  ${service.padEnd(30)}${String(count).padStart(4)}   ${((count / window.length) * 100).toFixed(0).padStart(3)}%  ${isoDay(recent?.date_created)}  ${bar(count, max)}`);
    }
    if (active.length) {
        lines.push("", "Active right now:");
        for (const incident of active)
            lines.push(`  - ${incident.title ?? "untitled"} (${incident.status ?? "status not reported"}, since ${isoDay(incident.date_created)})`);
    }
    else {
        lines.push("", "No incident is active on Slack's status page at the moment this was read.");
    }
    lines.push("", "Share is incidents affecting the service over incidents in the window; an incident naming several services counts once in each service, so the shares do not sum to 100%. Taken from Slack's published status record, not from any workspace.");
    return lines.join("\n");
}
