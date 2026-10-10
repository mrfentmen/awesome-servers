export class OdyseeError extends Error {
    constructor(message) {
        super(message);
        this.name = "OdyseeError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
function envStrict(name) {
    const v = process.env[name];
    if (!v)
        throw new OdyseeError(`Set the ${name} environment variable.`);
    return v;
}
async function authHeaders() {
    return {};
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
        throw new OdyseeError(`HTTP ${res.status}: ${detail}`);
    }
    return data;
}
export async function searchClaims(query, size) {
    let url = `https://lighthouse.odysee.tv/search`;
    const qs = new URLSearchParams();
    qs.append("s", String(query));
    if (size !== undefined)
        qs.append("size", String(size));
    qs.append("free_only", "true");
    const qstr = qs.toString();
    if (qstr)
        url += (url.includes('?') ? '&' : '?') + qstr;
    const data = await req(url);
    return pretty(data);
}
export async function searchChannel(channel, size) {
    let url = `https://lighthouse.odysee.tv/search`;
    const qs = new URLSearchParams();
    qs.append("s", String(channel));
    qs.append("channel", String(channel));
    if (size !== undefined)
        qs.append("size", String(size));
    const qstr = qs.toString();
    if (qstr)
        url += (url.includes('?') ? '&' : '?') + qstr;
    const data = await req(url);
    return pretty(data);
}
// ---- muxC tools:
// lighthouse.odysee.tv/search only understands s/size/channel/free_only, so
// anything richer goes through Odysee's own JSON-RPC proxy, which is the
// documented public API for resolving claims and channels.
const ODYSEE_PROXY = "https://api.na-backend.odysee.com/api/v1/proxy";
async function odyseeRpc(method, params) {
    let res;
    try {
        res = await fetch(ODYSEE_PROXY, {
            method: "POST",
            headers: { ...UA, "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({ method, params }),
            signal: AbortSignal.timeout(30000),
        });
    }
    catch (e) {
        throw new OdyseeError(`Odysee API unreachable: ${e instanceof Error ? e.message : String(e)}`);
    }
    const body = (await res.json());
    if (body.error)
        throw new OdyseeError(`Odysee API error: ${body.error.message ?? "unknown"}`);
    return body.result ?? {};
}
function claimAtTime(seconds) {
    if (seconds === undefined)
        return "not reported";
    const n = Number(seconds);
    if (!Number.isFinite(n) || n <= 0)
        return "not reported";
    return new Date(n * 1000).toISOString().slice(0, 10);
}
function durationText(seconds) {
    if (seconds === undefined || !Number.isFinite(seconds))
        return "not reported";
    const total = Math.round(seconds);
    const m = Math.floor(total / 60);
    return `${m}m ${String(total % 60).padStart(2, "0")}s`;
}
/** Resolve one Odysee URL - lbry:// or https - into its full claim record. */
export async function videoDetails(args) {
    const raw = (args.url ?? "").trim();
    if (!raw)
        throw new OdyseeError("Provide an Odysee URL, e.g. lbry://@channel#f/Title#ab or an https://odysee.com link");
    const url = raw.replace(/^https?:\/\/odysee\.tv\//, "lbry://");
    const result = await odyseeRpc("resolve", { urls: [url] });
    const claim = result[url];
    if (!claim || claim?.error) {
        throw new OdyseeError(`Odysee could not resolve ${url}`);
    }
    const v = claim.value ?? {};
    const channel = claim.signing_channel?.name ?? "not reported";
    return [
        `Title: ${v.title ?? claim.name ?? "not reported"}`,
        `Type: ${claim.type ?? "not reported"} | channel: ${channel}`,
        `Duration: ${durationText(v.duration)} | views: ${v.view_count ?? "not reported"}`,
        `Published: ${claimAtTime(v.release_time ?? claim.timestamp)} | claimed: ${claimAtTime(claim.timestamp)}`,
        `License: ${v.license ?? "not reported"} | language: ${v.language ?? "not reported"}`,
        `Tags: ${v.tags?.length ? v.tags.slice(0, 10).join(", ") : "not reported"}`,
        `Odysee: https://odysee.tv/@${(channel.startsWith("@") ? channel.slice(1) : channel)}`,
        v.description ? `Description: ${v.description.slice(0, 300)}` : null,
    ]
        .filter(Boolean)
        .join("\n");
}
/** Resolve an Odysee channel handle into its public record. */
export async function channelProfile(args) {
    let handle = (args.channel ?? "").trim();
    if (!handle)
        throw new OdyseeError("Provide a channel handle, e.g. @veritasium");
    if (!handle.startsWith("@"))
        handle = `@${handle}`;
    const url = `lbry://${handle}`;
    const result = await odyseeRpc("resolve", { urls: [url] });
    const claim = result[url];
    if (!claim || claim?.error) {
        throw new OdyseeError(`Odysee has no channel ${handle}`);
    }
    const m = claim.meta ?? {};
    return [
        `Channel: ${claim.name ?? handle}`,
        `Claim id: ${claim.claim_id ?? "not reported"} | type: ${claim.type ?? "not reported"}`,
        `Uploads: ${m.claims_in_channel ?? "not reported"} | reposts: ${m.reposted ?? "not reported"}`,
        `Created: ${claimAtTime(m.creation_timestamp)} | activated at height: ${m.activation_height ?? "not reported"}`,
        `Support amount: ${m.effective_amount ?? "not reported"} LBC`,
        `Odysee: https://odysee.tv/${handle}`,
    ].join("\n");
}
