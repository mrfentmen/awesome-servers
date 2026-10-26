export class PusherError extends Error {
    constructor(message) {
        super(message);
        this.name = "PusherError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
import crypto from "node:crypto";
function conf() {
    const appId = process.env.PUSHER_APP_ID;
    const key = process.env.PUSHER_KEY;
    const secret = process.env.PUSHER_SECRET;
    if (!appId || !key || !secret)
        throw new PusherError("Set PUSHER_APP_ID, PUSHER_KEY and PUSHER_SECRET (free Pusher tier).");
    return { appId, key, secret, cluster: process.env.PUSHER_CLUSTER ?? "mt1" };
}
function signedUrl(path, extra = {}) {
    const { appId, key, secret, cluster } = conf();
    const params = { auth_key: key, auth_timestamp: String(Math.floor(Date.now() / 1000)), auth_version: "1.0", ...extra };
    const fullPath = `/apps/${appId}${path}`;
    const query = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join("&");
    const signable = `GET\n${fullPath}\n${query}`;
    const sig = crypto.createHmac("sha256", secret).update(signable).digest("hex");
    return `https://api-${cluster}.pusher.com${fullPath}?${query}&auth_signature=${sig}`;
}
async function get(url) {
    let res;
    try {
        res = await fetch(url, { signal: AbortSignal.timeout(30000), headers: { ...UA, Accept: "application/json" } });
    }
    catch (e) {
        throw new PusherError(`Network error: ${e.message}`);
    }
    if (!res.ok) {
        const body = (await res.text()).slice(0, 300);
        throw new PusherError(`HTTP ${res.status}: ${body}`);
    }
    return res.text();
}
export function listChannels(prefix, limit) {
    const extra = {};
    if (prefix)
        extra.filter_by_prefix = prefix;
    if (limit)
        extra.limit = String(Math.min(Number(limit) || 100, 100));
    extra.info = "user_count";
    return get(signedUrl("/channels", extra));
}
export function getChannel(channel) {
    return get(signedUrl(`/channels/${encodeURIComponent(channel)}`, { info: "user_count,subscription_count" }));
}
export function getChannelUsers(channel) {
    return get(signedUrl(`/channels/${encodeURIComponent(channel)}/users`));
}
// ---- muxH tools:
// Every tool above talks to one Pusher app over a signed REST call. These two
// test the thing Pusher is actually selling: the websocket itself. A public
// echo endpoint is used as a control, so a round trip and a payload can be
// measured end to end without any Pusher credentials at all.
const PUSHER_UA = "pusher-mcp/1.1 (https://github.com/mcfentmen/pusher-mcp)";
const ECHO_WS = "wss://ws.postman-echo.com/raw";
const clampNum = (v, lo, hi, dflt) => {
    const n = Number(v);
    if (!Number.isFinite(n))
        return dflt;
    return Math.min(Math.max(n, lo), hi);
};
function wsTarget(url) {
    const raw = String(url ?? "").trim() || ECHO_WS;
    let parsed;
    try {
        parsed = new URL(raw);
    }
    catch {
        throw new PusherError(`"${raw}" is not a URL. Give a ws:// or wss:// endpoint, or leave it out to use the public echo.`);
    }
    if (parsed.protocol !== "ws:" && parsed.protocol !== "wss:")
        throw new PusherError(`${parsed.protocol} is not a websocket scheme; use ws:// or wss://.`);
    return parsed;
}
function requireWebSocket() {
    if (typeof WebSocket !== "function")
        throw new PusherError(`This Node (${process.version}) has no built-in WebSocket client; the tool needs Node 21 or newer.`);
}
function openSocket(target, timeoutMs = 15000) {
    return new Promise((resolve, reject) => {
        const started = performance.now();
        let settled = false;
        const ws = new WebSocket(target.href);
        const timer = setTimeout(() => {
            if (settled)
                return;
            settled = true;
            try {
                ws.close();
            }
            catch { }
            reject(new PusherError(`The socket at ${target.host} did not open within ${Math.round(timeoutMs / 1000)}s; the host may block websockets or want a different path.`));
        }, timeoutMs);
        ws.onopen = () => {
            if (settled)
                return;
            settled = true;
            clearTimeout(timer);
            resolve({ ws, handshakeMs: performance.now() - started });
        };
        ws.onerror = () => {
            if (settled)
                return;
            settled = true;
            clearTimeout(timer);
            reject(new PusherError(`Could not open a websocket to ${target.host}. Public echo endpoints are sometimes down; pass url to test your own.`));
        };
    });
}
function sendOnce(ws, data, timeoutMs = 20000) {
    return new Promise((resolve, reject) => {
        const started = performance.now();
        let settled = false;
        const done = (fn, value) => {
            if (settled)
                return;
            settled = true;
            clearTimeout(timer);
            ws.onmessage = null;
            ws.onerror = null;
            fn(value);
        };
        const timer = setTimeout(() => done(reject, new PusherError(`No echo came back within ${Math.round(timeoutMs / 1000)}s; the endpoint accepted the frame but did not return it.`)), timeoutMs);
        ws.onmessage = (m) => done(resolve, { data: m.data, ms: performance.now() - started });
        ws.onerror = () => done(reject, new PusherError("The socket errored while waiting for the echo."));
        try {
            ws.send(data);
        }
        catch (e) {
            done(reject, new PusherError(`The frame could not be sent: ${e instanceof Error ? e.message : String(e)}`));
        }
    });
}
const ms = (n) => `${n.toFixed(1)} ms`;
const mbs = (bytes, msTaken) => (msTaken <= 0 ? "-" : `${(bytes / (msTaken / 1000) / 1048576).toFixed(2)} MB/s`);
function median(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
/**
 * Open a real websocket, time the handshake, then time several round trips of
 * a known payload. The echo endpoint is a control: it proves the path and the
 * client work, and gives a latency floor, but it is not the Pusher network.
 */
export async function websocketRoundTrip(args) {
    requireWebSocket();
    const target = wsTarget(args?.url);
    const payloadKb = Math.round(clampNum(args?.payload_kb, 1, 64, 4));
    const samples = Math.round(clampNum(args?.samples, 2, 20, 5));
    const bodyBytes = payloadKb * 1024;
    const { ws, handshakeMs } = await openSocket(target);
    const times = [];
    let mismatched = 0;
    try {
        for (let i = 1; i <= samples; i += 1) {
            const nonce = `rt-${i}-${Date.now().toString(36)}`;
            const frame = nonce + "x".repeat(Math.max(0, bodyBytes - nonce.length));
            const { data, ms: elapsed } = await sendOnce(ws, frame);
            times.push(elapsed);
            const returned = typeof data === "string" ? data : "";
            if (returned !== frame)
                mismatched += 1;
        }
    }
    finally {
        try {
            ws.close();
        }
        catch { }
    }
    const total = times.reduce((a, b) => a + b, 0);
    const best = Math.min(...times);
    const worst = Math.max(...times);
    const rows = [
        `Websocket round trip against ${target.href}`,
        `  handshake        ${ms(handshakeMs)}`,
        `  frames           ${samples} × ${payloadKb} KB (${bodyBytes} bytes each)`,
        `  fastest          ${ms(best)}`,
        `  median           ${ms(median(times))}`,
        `  mean             ${ms(total / times.length)}`,
        `  slowest          ${ms(worst)}`,
        `  jitter (max-min) ${ms(worst - best)}`,
        `  throughput       ${mbs(bodyBytes, median(times))} at the median round trip`,
        mismatched
            ? `  integrity        ${mismatched} of ${samples} frame(s) came back different from what was sent`
            : `  integrity        all ${samples} frame(s) returned byte-for-byte`,
        "",
        `Per-frame: ${times.map((t) => t.toFixed(1)).join(", ")} ms`,
        "",
        `note: measured on one connection from this machine to ${target.host}; the handshake includes DNS, TLS and the HTTP upgrade. Throughput is one frame per round trip, so it is limited by latency rather than bandwidth.`,
    ];
    return rows.join("\n");
}
/**
 * The payloads that break naive clients: nothing, one byte, characters wider
 * than a byte, structured text, and a frame far bigger than a typical write.
 */
export async function websocketPayloadProbe(args) {
    requireWebSocket();
    const target = wsTarget(args?.url);
    const largeKb = Math.round(clampNum(args?.large_kb, 1, 512, 48));
    const json = JSON.stringify({ probe: "mcp", at: new Date().toISOString(), items: [{ id: 1, ok: true }, { id: 2, ok: false }], note: "日本語 🎉" });
    const probes = [
        { label: "empty string", data: "" },
        { label: "single character", data: "x" },
        { label: "multi-byte UTF-8", data: "héllo — 日本語 — 🎉 — Ω" },
        { label: "JSON document", data: json },
        { label: "large frame", data: "L".repeat(largeKb * 1024) },
    ];
    const lines = [`Websocket payload probe against ${target.href}`, ""] ;
    let passed = 0;
    for (const probe of probes) {
        const { ws, handshakeMs } = await openSocket(target);
        try {
            const { data, ms: elapsed } = await sendOnce(ws, probe.data);
            const returned = typeof data === "string" ? data : null;
            const bytes = Buffer.byteLength(probe.data, "utf8");
            const same = returned === probe.data;
            if (same)
                passed += 1;
            const verdict = same
                ? `returned intact in ${ms(elapsed)}`
                : returned === null
                    ? `came back as a non-text frame in ${ms(elapsed)} — binary frames are not echoed as text`
                    : `came back different: sent ${bytes} byte(s), got ${Buffer.byteLength(returned, "utf8")} byte(s) in ${ms(elapsed)}`;
            lines.push(`  ${probe.label.padEnd(18)} ${String(bytes).padStart(5)} B  ${verdict}`);
            lines.push(`  ${"".padEnd(18)} handshake ${ms(handshakeMs)}`);
        }
        catch (e) {
            lines.push(`  ${probe.label.padEnd(18)} ${String(Buffer.byteLength(probe.data, "utf8")).padStart(5)} B  FAILED — ${errorMessage(e)}`);
        }
        finally {
            try {
                ws.close();
            }
            catch { }
        }
    }
    lines.push("", `${passed} of ${probes.length} payload(s) survived the round trip unchanged.`, "", "note: each payload gets a fresh connection, so the handshake is measured separately; a server that rejects empty frames will show it as a failed probe rather than a silent pass. This tests the transport, not Pusher's delivery.");
    return lines.join("\n");
}
