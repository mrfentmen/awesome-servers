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
