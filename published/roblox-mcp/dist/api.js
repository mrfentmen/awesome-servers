const BASE = 'https://users.roblox.com/v1/users';
export async function user(args) {
    const id = Math.floor(args.id ?? 0);
    if (!id)
        return 'Provide a numeric user id.';
    const res = await fetch(`${BASE}/${id}`, {
        headers: { 'User-Agent': 'mrfentmen-roblox-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Roblox returned ${res.status}`);
    const d = (await res.json());
    const s = (k) => (d[k] != null ? String(d[k]) : '');
    return [
        `${s('displayName')} (${s('name')})`,
        s('description') ? `\n${s('description').slice(0, 150)}` : '',
        s('created') ? `Created: ${String(s('created')).slice(0, 10)}` : '',
        s('isBanned') === 'true' ? 'Status: banned' : 'Status: active',
    ].filter(Boolean).join('\n') || `No data for user ${id}.`;
}
// ---- muxC tools:
const RBX_UA = "mrfentmen-roblox-mcp/1.0 (https://github.com/mrfentmen)";
async function rbxJson(url, ms = 25000) {
    const res = await fetch(url, { headers: { "User-Agent": RBX_UA, Accept: "application/json" }, signal: AbortSignal.timeout(ms) });
    if (res.status === 404)
        throw new Error("Roblox has no such public record");
    if (res.status === 429)
        throw new Error("Roblox is rate limiting this client");
    if (!res.ok)
        throw new Error(`Roblox returned ${res.status} for ${url}`);
    return await res.json();
}
function username(v) {
    const u = (v ?? "").trim();
    if (!u)
        throw new Error("Provide a Roblox username");
    if (!/^[A-Za-z0-9_]{3,20}$/.test(u))
        throw new Error("A Roblox username is 3 to 20 letters, digits or underscores");
    return u;
}
