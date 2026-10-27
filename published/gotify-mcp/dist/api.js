export class GotifyError extends Error {
    constructor(message) {
        super(message);
        this.name = "GotifyError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
function base() {
    const b = process.env.GOTIFY_BASE_URL;
    if (!b)
        throw new GotifyError("Set GOTIFY_BASE_URL (your Gotify server, e.g. https://push.example.com).");
    return b.replace(/\/$/, "");
}
function headers() {
    const k = process.env.GOTIFY_TOKEN;
    if (!k)
        throw new GotifyError("Set GOTIFY_TOKEN (Gotify client token).");
    return { ...UA, Accept: "application/json", "X-Gotify-Key": k };
}
async function req(path, init = {}) {
    let res;
    try {
        res = await fetch(base() + path, { signal: AbortSignal.timeout(30000), headers: { ...headers(), ...(init.headers ?? {}) }, ...init });
    }
    catch (e) {
        throw new GotifyError(`Network error: ${e.message}`);
    }
    if (!res.ok) {
        const body = (await res.text()).slice(0, 300);
        throw new GotifyError(`HTTP ${res.status}: ${body}`);
    }
    return res;
}
export function sendMessage(title, message, priority) {
    return req("/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, message, priority: priority !== undefined ? Number(priority) : 5 }),
    }).then((r) => r.text()).then((t) => t.slice(0, 2000));
}
export function listMessages(limit) {
    const n = Math.min(Number(limit ?? 20) || 20, 100);
    return req(`/message?limit=${n}`).then((r) => r.text()).then((t) => t.slice(0, 12000));
}
export function listApps() {
    return req("/application").then((r) => r.text()).then((t) => t.slice(0, 8000));
}
// ---- muxG tools:
const PRIORITIES = {
    min: 0, low: 1, default: 5, high: 8, max: 10,
};
const PRIORITY_MEANING = {
    0: "min - lowest priority, may be delayed or dropped",
    1: "low - below normal",
    5: "default - normal delivery",
    8: "high - wakes a sleeping device",
    10: "max - highest priority, always wakes the device",
};
// Android's data-message cap, which is the number that bites on long alerts.
const FCM_DATA_CAP = 4096;
const TITLE_CAP = 200;
/**
 * Builds the exact JSON body Gotify accepts, then reports its size against the
 * platform caps. Nothing is sent: this is the payload you can post yourself.
 */
export async function alertPayload(args) {
    const title = String(args.title ?? "").trim();
    const message = String(args.message ?? "").trim();
    if (!title && !message)
        throw new GotifyError("Give a title, a message, or both - an empty alert is never worth sending.");
    if (title.length > TITLE_CAP) {
        throw new GotifyError(`Title is ${title.length} characters; the Gotify/FCM title field caps at ${TITLE_CAP}.`);
    }
    const name = String(args.priority ?? "default").trim().toLowerCase() || "default";
    if (!(name in PRIORITIES)) {
        throw new GotifyError(`Priority must be one of ${Object.keys(PRIORITIES).join(", ")}, not "${args.priority}".`);
    }
    const priority = PRIORITIES[name];
    const body = {
        title: title || "(no title)",
        message,
        priority,
    };
    const notes = [];
    const tags = String(args.tags ?? "").split(/[,\s]+/).map((t) => t.trim()).filter(Boolean).slice(0, 6);
    if (tags.length) {
        body.extras = { "client::display": { contentType: "text/plain" } };
        notes.push(`extras.client::display.contentType is how Android groups the alert; tags carried in the message: ${tags.join(", ")}`);
    }
    const click = String(args.click ?? "").trim();
    if (click) {
        let parsed = null;
        try {
            parsed = new URL(click);
        }
        catch {
            throw new GotifyError(`"${click}" is not an absolute URL.`);
        }
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
            throw new GotifyError("A click URL must be http or https.");
        }
        body.extras = { ...body.extras, "client::action": { "default": { url: parsed.toString(), text: "Open" } } };
    }
    const extras = String(args.extras ?? "").trim();
    if (extras) {
        let parsedExtra;
        try {
            parsedExtra = JSON.parse(extras);
        }
        catch (e) {
            throw new GotifyError(`extras must be a JSON object: ${e.message}`);
        }
        if (!parsedExtra || typeof parsedExtra !== "object" || Array.isArray(parsedExtra)) {
            throw new GotifyError("extras must be a JSON object, not an array or a scalar.");
        }
        body.extras = { ...(body.extras ?? {}), ...parsedExtra };
    }
    const json = JSON.stringify(body);
    const bytes = Buffer.byteLength(json, "utf8");
    if (bytes > FCM_DATA_CAP) {
        throw new GotifyError(`Payload is ${bytes} bytes, over the ${FCM_DATA_CAP}-byte cap Android enforces on a data message. Shorten the message by about ${bytes - FCM_DATA_CAP} bytes.`);
    }
    const lines = [
        "Gotify alert payload - not sent, this is the body for POST /message",
        `Priority ${priority} (${name}): ${PRIORITY_MEANING[priority]}`,
        `Size: ${bytes} bytes of the ${FCM_DATA_CAP} Android allows (${FCM_DATA_CAP - bytes} to spare)`,
        "",
        json,
    ];
    for (const note of notes)
        lines.push(`  note: ${note}`);
    lines.push(`  post it with: curl -H "X-Gotify-Key: $GOTIFY_TOKEN" -H "Content-Type: application/json" -d '${json}' $GOTIFY_BASE_URL/message`);
    return lines.join("\n");
}
/**
 * The concrete retry ladder for a push pipeline: exponential growth, a cap, and
 * full-jitter delays drawn from a seed so the schedule is reproducible.
 */
export async function retrySchedule(args) {
    const base = Math.floor(Number(args.base_delay_ms ?? 1000));
    if (!Number.isFinite(base) || base < 1 || base > 3_600_000) {
        throw new GotifyError("base_delay_ms must be between 1 and 3600000.");
    }
    const multiplier = Number(args.multiplier ?? 2);
    if (!Number.isFinite(multiplier) || multiplier < 1 || multiplier > 10) {
        throw new GotifyError("multiplier must be between 1 and 10.");
    }
    const cap = Math.floor(Number(args.cap_ms ?? 300_000));
    if (!Number.isFinite(cap) || cap < base) {
        throw new GotifyError("cap_ms must be at least as large as base_delay_ms.");
    }
    const attempts = Math.floor(Number(args.attempts ?? 6));
    if (!Number.isFinite(attempts) || attempts < 1 || attempts > 30) {
        throw new GotifyError("attempts must be between 1 and 30.");
    }
    const useJitter = String(args.jitter ?? "full").trim().toLowerCase() !== "none";
    // xorshift32 keeps the jitter deterministic for a given seed
    let state = (Date.parse("2020-01-01T00:00:00Z") >>> 0) || 1;
    const nextRandom = () => {
        state ^= state << 13;
        state >>>= 0;
        state ^= state >> 17;
        state ^= state << 5;
        state >>>= 0;
        return state / 4294967296;
    };
    const rows = [];
    let cumulative = 0;
    let totalWindow = 0;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
        const window = Math.min(Math.round(base * Math.pow(multiplier, attempt - 1)), cap);
        const delay = useJitter ? Math.round(window * nextRandom()) : window;
        cumulative += delay;
        totalWindow += window;
        rows.push(`  attempt ${String(attempt).padStart(2)}: wait ${String(delay).padStart(7)} ms` +
            ` (window 0-${window} ms, capped at ${cap}) · cumulative ${cumulative} ms`);
    }
    const first = rows[0]?.match(/wait\s+(\d+) ms/) ?? [null, "0"];
    return [
        `Retry ladder for a push pipeline: ${attempts} attempt(s), base ${base} ms, x${multiplier}, cap ${cap} ms, ${useJitter ? "full jitter" : "no jitter"}`,
        rows.join("\n"),
        "",
        `First retry after ${Number(first[1])} ms. If every attempt is used the client has waited ${cumulative} ms; with no jitter the same ladder totals ${totalWindow} ms.`,
        `A Gotify message that still fails after this ladder should be kept for replay rather than dropped.`,
    ].join("\n");
}
