/**
 * Discord public API client, keyless (no bot token).
 * Invite lookup and server widgets are public endpoints.
 * Docs: https://discord.com/developers/docs/resources/invite
 */
const BASE = "https://discord.com/api/v9";
export class DiscordError extends Error {
}
async function getJson(path) {
    const res = await fetch(`${BASE}${path}`, {
        headers: { "User-Agent": "discord-mcp/1.0", Accept: "application/json" },
        signal: AbortSignal.timeout(15000),
    });
    if (res.status === 404)
        throw new DiscordError("Not found (bad invite code or widget disabled).");
    if (res.status === 403)
        throw new DiscordError("Forbidden (server widget is disabled).");
    if (res.status === 429)
        throw new DiscordError("Discord rate limit hit; wait a minute and retry.");
    if (!res.ok)
        throw new DiscordError(`Discord error ${res.status}`);
    return (await res.json());
}
export async function lookupInvite(code) {
    const clean = code.trim().replace(/^https?:\/\/(www\.)?discord(\.com\/invite|\.gg)\//, "").split(/[?/]/)[0];
    if (!clean)
        throw new DiscordError(`Not an invite code or URL: "${code}".`);
    const inv = await getJson(`/invites/${encodeURIComponent(clean)}?with_counts=true&with_expiration=true`);
    const g = inv.guild ?? {};
    const ch = inv.channel ?? {};
    return {
        code: String(inv.code ?? clean),
        guildId: g.id,
        guildName: g.name,
        description: g.description,
        members: typeof inv.approximate_member_count === "number" ? inv.approximate_member_count : undefined,
        online: typeof inv.approximate_presence_count === "number" ? inv.approximate_presence_count : undefined,
        channel: ch.name,
        expires: inv.expires_at ? String(inv.expires_at).slice(0, 10) : undefined,
    };
}
export async function getWidget(guildId) {
    if (!/^\d+$/.test(guildId.trim()))
        throw new DiscordError(`Guild id must be numeric, got "${guildId}".`);
    const w = await getJson(`/guilds/${guildId.trim()}/widget.json`);
    const channels = Array.isArray(w.channels) ? w.channels : [];
    const members = Array.isArray(w.members) ? w.members : [];
    return {
        guildId: guildId.trim(),
        name: w.name,
        online: members.length || undefined,
        channels: channels.map((c) => String(c.name)).slice(0, 15),
        invite: w.instant_invite ? `https://discord.gg/${w.instant_invite}` : undefined,
    };
}
export function formatInvite(inv) {
    const lines = [
        `discord.gg/${inv.code}${inv.guildName ? ` — ${inv.guildName}` : ""}`,
        inv.description ? `${inv.description}` : "",
        inv.members !== undefined ? `Members: ${inv.members.toLocaleString()}${inv.online !== undefined ? ` (${inv.online.toLocaleString()} online)` : ""}` : "",
        inv.channel ? `Channel: #${inv.channel}` : "",
        inv.guildId ? `Guild id: ${inv.guildId}` : "",
        inv.expires ? `Expires: ${inv.expires}` : "Never expires",
    ].filter(Boolean);
    return lines.join("\n");
}
export function formatWidget(w) {
    const lines = [
        `${w.name ?? "Server"} [${w.guildId}]`,
        w.online !== undefined ? `${w.online} online now` : "",
        w.channels.length ? `Top channels: ${w.channels.join(", ")}` : "",
        w.invite ? `Join: ${w.invite}` : "",
    ].filter(Boolean);
    return lines.join("\n");
}
export async function widgetMembers(guildId) {
    if (!/^\d+$/.test(guildId.trim()))
        throw new DiscordError(`Guild id must be numeric, got "${guildId}".`);
    const w = await getJson(`/guilds/${guildId.trim()}/widget.json`);
    const members = Array.isArray(w.members) ? w.members : [];
    return members.slice(0, 25).map((m) => ({
        username: typeof m.username === "string" ? m.username : undefined,
        status: typeof m.status === "string" ? m.status : undefined,
        game: typeof m.game?.name === "string" ? m.game.name : undefined,
    }));
}
export function formatMembers(members, guildId) {
    if (!members.length)
        return `No online members visible for ${guildId}.`;
    return `Online now (${members.length} shown):\n` + members.map((m, i) => `${i + 1}. ${m.username ?? "?"} [${m.status ?? "?"}]${m.game ? ` playing ${m.game}` : ""}`).join("\n");
}
