export class NtfyError extends Error {
    constructor(message) {
        super(message);
        this.name = "NtfyError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
function base() {
    return (process.env.NTFY_BASE_URL ?? "https://ntfy.sh").replace(/\/$/, "");
}
function headers() {
    const h = { ...UA, Accept: "application/json" };
    if (process.env.NTFY_TOKEN)
        h.Authorization = `Bearer ${process.env.NTFY_TOKEN}`;
    return h;
}
async function call(topic, method, body, query = "") {
    let res;
    try {
        res = await fetch(`${base()}/${encodeURIComponent(topic)}${query}`, {
            method,
            headers: { ...headers(), ...(method === "POST" ? { Title: "MCP" } : {}) },
            body,
            signal: AbortSignal.timeout(25000),
        });
    }
    catch (e) {
        throw new NtfyError(`Network error: ${e.message}`);
    }
    const text = await res.text();
    if (!res.ok)
        throw new NtfyError(`HTTP ${res.status}: ${text.slice(0, 300)}`);
    return text.slice(0, 8000);
}
export function publish(topic, message) {
    return call(topic, "POST", message);
}
export function poll(topic) {
    return call(topic, "GET", undefined, "/json?poll=1");
}
export function health() {
    return (async () => {
        let res;
        try {
            res = await fetch(`${base()}/v1/health`, { headers: { ...UA }, signal: AbortSignal.timeout(25000) });
        }
        catch (e) {
            throw new NtfyError(`Network error: ${e.message}`);
        }
        if (!res.ok) {
            const body = (await res.text()).slice(0, 300);
            throw new NtfyError(`HTTP ${res.status}: ${body}`);
        }
        return (await res.text()).slice(0, 1000);
    })();
}
export function account() {
    return (async () => {
        let res;
        try {
            res = await fetch(`${base()}/v1/account`, { headers: headers(), signal: AbortSignal.timeout(25000) });
        }
        catch (e) {
            throw new NtfyError(`Network error: ${e.message}`);
        }
        const text = await res.text();
        if (!res.ok)
            throw new NtfyError(`HTTP ${res.status}: ${text.slice(0, 300)}`);
        return text.slice(0, 2000);
    })();
}
export function pollSince(topic, sinceId) {
    return call(topic, "GET", undefined, `/json?poll=1&since=${encodeURIComponent(sinceId)}`);
}
export function sendUrgent(topic, message) {
    return (async () => {
        let res;
        try {
            res = await fetch(`${base()}/${encodeURIComponent(topic)}`, {
                method: "POST",
                headers: { ...headers(), Priority: "urgent", Title: "MCP urgent" },
                body: message,
                signal: AbortSignal.timeout(25000),
            });
        }
        catch (e) {
            throw new NtfyError(`Network error: ${e.message}`);
        }
        const text = await res.text();
        if (!res.ok)
            throw new NtfyError(`HTTP ${res.status}: ${text.slice(0, 300)}`);
        return text.slice(0, 2000);
    })();
}
export function sendScheduled(topic, message, delay) {
    return (async () => {
        let res;
        try {
            res = await fetch(`${base()}/${encodeURIComponent(topic)}`, {
                method: "POST",
                headers: { ...headers(), Delay: delay, Title: "MCP scheduled" },
                body: message,
                signal: AbortSignal.timeout(25000),
            });
        }
        catch (e) {
            throw new NtfyError(`Network error: ${e.message}`);
        }
        const text = await res.text();
        if (!res.ok)
            throw new NtfyError(`HTTP ${res.status}: ${text.slice(0, 300)}`);
        return text.slice(0, 2000);
    })();
}
export function sendEmail(topic, message, email) {
    return (async () => {
        let res;
        try {
            res = await fetch(`${base()}/${encodeURIComponent(topic)}`, {
                method: "POST",
                headers: { ...headers(), Email: email, Title: "MCP" },
                body: message,
                signal: AbortSignal.timeout(25000),
            });
        }
        catch (e) {
            throw new NtfyError(`Network error: ${e.message}`);
        }
        const text = await res.text();
        if (!res.ok)
            throw new NtfyError(`HTTP ${res.status}: ${text.slice(0, 300)}`);
        return text.slice(0, 2000);
    })();
}
export function sendCall(topic, message, phone) {
    return (async () => {
        let res;
        try {
            res = await fetch(`${base()}/${encodeURIComponent(topic)}`, {
                method: "POST",
                headers: { ...headers(), Call: `tel:${phone}`, Title: "MCP call" },
                body: message,
                signal: AbortSignal.timeout(25000),
            });
        }
        catch (e) {
            throw new NtfyError(`Network error: ${e.message}`);
        }
        const text = await res.text();
        if (!res.ok)
            throw new NtfyError(`HTTP ${res.status}: ${text.slice(0, 300)}`);
        return text.slice(0, 2000);
    })();
}
export function publishTags(topic, message, tags) {
    return (async () => {
        let res;
        try {
            res = await fetch(`${base()}/${encodeURIComponent(topic)}`, {
                method: "POST",
                headers: { ...headers(), Tags: tags, Title: "MCP" },
                body: message,
                signal: AbortSignal.timeout(25000),
            });
        }
        catch (e) {
            throw new NtfyError(`Network error: ${e.message}`);
        }
        const text = await res.text();
        if (!res.ok)
            throw new NtfyError(`HTTP ${res.status}: ${text.slice(0, 300)}`);
        return text.slice(0, 2000);
    })();
}
// ---- muxF tools:
/**
 * ntfy's own API needs a topic and, for anything private, a token. Two of its
 * surfaces are public without either: the server's health and configuration
 * document, and the message history of a topic that is itself public.
 */
const NTFY_HEALTH = "/v1/health";
const NTFY_CONFIG = "/v1/config";
const ntfyTopicName = (input) => {
    const topic = String(input ?? "").trim().replace(/^\/+|\/+$/g, "");
    if (!/^[\w.-]{1,64}$/.test(topic))
        throw new NtfyError(`"${input}" is not a usable ntfy topic name.`);
    return topic;
};
const ntfyBytes = (value) => {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0)
        return "not reported";
    if (n >= 1e9)
        return `${(n / 1e9).toFixed(2)} GB`;
    if (n >= 1e6)
        return `${(n / 1e6).toFixed(1)} MB`;
    if (n >= 1e3)
        return `${(n / 1e3).toFixed(1)} kB`;
    return `${n} B`;
};
const ntfyAgo = (seconds) => {
    const n = Number(seconds);
    if (!Number.isFinite(n) || n <= 0)
        return "not reported";
    const delta = Date.now() / 1000 - n;
    if (delta < 3600)
        return `${Math.max(1, Math.round(delta / 60))} minute(s) ago`;
    if (delta < 86400)
        return `${Math.round(delta / 3600)} hour(s) ago`;
    return `${Math.round(delta / 86400)} day(s) ago`;
};
/** What this ntfy server will and will not let you do, read from its public config. */
export async function ntfyServerCapabilities(_args) {
    // The shared call() builds a topic URL, so the two server-level paths are
    // fetched directly here.
    const serverGet = async (path, what) => {
        let res;
        try {
            res = await fetch(`${base()}${path}`, { headers: { ...headers() }, signal: AbortSignal.timeout(25000) });
        }
        catch (e) {
            throw new NtfyError(`Network error on ${what}: ${errorMessage(e)}`);
        }
        if (!res.ok)
            throw new NtfyError(`The server answered HTTP ${res.status} for ${what}.`);
        const raw = await res.text();
        if (!raw.trim())
            throw new NtfyError(`The server returned an empty body for ${what}.`);
        return raw;
    };
    const healthRaw = await serverGet(NTFY_HEALTH, "the health endpoint");
    const configRaw = await serverGet(NTFY_CONFIG, "the config endpoint");
    let health;
    let config;
    try {
        health = JSON.parse(healthRaw);
        config = JSON.parse(configRaw);
    }
    catch {
        throw new NtfyError("The server answered the health or config path with something that is not JSON.");
    }
    if (health.healthy !== true)
        throw new NtfyError("This ntfy server reports itself unhealthy.");
    const server = base().replace(/^https?:\/\//, "");
    const authMethods = Object.keys(config.auth_methods ?? {});
    const limits = [
        ["attachment size limit", ntfyBytes(config.attachment_file_size_limit)],
        ["attachment total limit", ntfyBytes(config.attachment_total_size_limit)],
        ["attachment expiry", String(config.attachment_expiry_duration ?? "not reported")],
        ["message cache duration", config.message_cache_duration ?? config.cache_duration ?? "not reported"],
        ["visitor requests per burst", String(config.visitor_request_limit_burst ?? "not reported")],
        ["visitor requests per day", String(config.visitor_request_limit_daily_limit ?? "not reported")],
        ["visitor rate limit", String(config.visitor_request_limit_visitor ?? "not reported")],
    ];
    const lines = [
        `ntfy server capabilities, read from the public health and config endpoints of ${server}`,
        `  healthy: yes, server time ${health.time ? new Date(health.time * 1000).toISOString().slice(0, 19).replace("T", " ") + " UTC" : "not reported"}`,
        `  base url: ${config.base_url || "not reported (served from the request host)"}, web app root ${config.app_root ?? "not reported"}`,
        `  access: login ${config.enable_login ? "enabled" : "disabled"}, login required for everything: ${config.require_login ? "yes" : "no"}, signup open: ${config.enable_signup ? "yes" : "no"}`,
        `  auth methods advertised: ${authMethods.length ? authMethods.join(", ") : "none listed, so API keys may be the only route"}`,
        `  features: web push ${config.enable_web_push ? "on" : "off"}, email ${config.enable_emails ? "on" : "off"}, calls ${config.enable_calls ? "on" : "off"}, payments ${config.enable_payments ? "on" : "off"}, reservations ${config.enable_reservations ? "on" : "off"}`,
        "",
        "  limit                          value",
    ];
    for (const [label, value] of limits)
        lines.push(`  ${label.padEnd(30)}${value}`);
    const disallowed = config.disallowed_topics ?? [];
    if (disallowed.length) {
        lines.push("");
        lines.push(`  ${disallowed.length} topic name(s) are reserved and cannot be published to: ${disallowed.slice(0, 10).join(", ")}${disallowed.length > 10 ? ", ..." : ""}`);
    }
    lines.push("");
    lines.push("  require_login: no is why a public topic can be read with no token at all; the per-visitor limits are what a reader will hit first.");
    return lines.join("\n");
}
/** Read back what a public topic has already published, with no token. */
export async function topicMessageHistory(args) {
    const topic = ntfyTopicName(args?.topic);
    const hours = Math.min(Math.max(Number(args?.hours ?? 24) || 24, 1), 24 * 30);
    const n = Math.min(Math.max(Number(args?.limit ?? 10) || 10, 1), 30);
    const since = Math.floor((Date.now() - hours * 3_600_000) / 1000);
    const raw = await call(topic, "GET", undefined, `/json?poll=1&since=${since}`);
    if (!raw.trim())
        return `Topic ${topic} on ${base().replace(/^https?:\/\//, "")} published nothing in the last ${hours} hour(s).`;
    const rows = [];
    for (const line of raw.split("\n")) {
        if (!line.trim())
            continue;
        try {
            rows.push(JSON.parse(line));
        }
        catch {
            /* skip a line the server interleaved */
        }
    }
    if (!rows.length)
        return `Topic ${topic} returned ${raw.length} character(s) but no message I could parse.`;
    const messages = rows.filter((r) => r.event === "message");
    const events = new Map();
    for (const row of rows)
        events.set(String(row.event ?? "not reported"), (events.get(String(row.event ?? "not reported")) ?? 0) + 1);
    const priorities = new Map();
    let withAttachment = 0;
    let tagged = 0;
    let longest = 0;
    for (const row of rows) {
        priorities.set(Number(row.priority ?? 0), (priorities.get(Number(row.priority ?? 0)) ?? 0) + 1);
        if (row.attachment)
            withAttachment += 1;
        if (row.tags?.length)
            tagged += 1;
        longest = Math.max(longest, String(row.message ?? "").length);
    }
    rows.sort((a, b) => Number(b.time ?? 0) - Number(a.time ?? 0));
    const lines = [
        `History of public topic "${topic}" on ${base().replace(/^https?:\/\//, "")}, last ${hours} hour(s)`,
        `  ${rows.length} event(s) returned, ${messages.length} of them messages, oldest ${ntfyAgo(rows[rows.length - 1]?.time)}`,
        `  event types: ${[...events.entries()].map(([event, count]) => `${event} (${count})`).join(", ")}`,
        `  priorities: ${[...priorities.entries()].sort((a, b) => a[0] - b[0]).map(([p, count]) => `${p} (${count})`).join(", ")}${priorities.has(5) ? " - a priority 5 message can wake a phone" : ""}`,
        `  ${withAttachment} with an attachment, ${tagged} carrying tags, longest body ${longest} character(s)`,
        "",
        "  time                 pri  expires     title / message",
    ];
    for (const row of rows.slice(0, n)) {
        const when = row.time ? new Date(row.time * 1000).toISOString().slice(0, 16).replace("T", " ") : "not reported";
        const body = `${row.title ? `${row.title}: ` : ""}${String(row.message ?? "(no message body)").replace(/\s+/g, " ").slice(0, 90)}`;
        const attachment = row.attachment ? ` [attachment ${row.attachment.filename ?? "?"} ${ntfyBytes(row.attachment.size)}]` : "";
        const tags = row.tags?.length ? ` [tags ${row.tags.join(",")}]` : "";
        lines.push(`  ${when}  ${String(row.priority ?? 0).padStart(3)}  ${String(row.expires ? ntfyAgo(row.expires) : "never").padEnd(10)} ${body}${attachment}${tags}`);
    }
    if (rows.length > n)
        lines.push(`  ...and ${rows.length - n} older event(s).`);
    lines.push("");
    lines.push("  A topic on ntfy.sh is public by default, which is why this needs no token; a private topic answers 403 without one.");
    return lines.join("\n");
}
