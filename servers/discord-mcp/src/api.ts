/**
 * Discord public API client, keyless (no bot token).
 * Invite lookup and server widgets are public endpoints.
 * Docs: https://discord.com/developers/docs/resources/invite
 */
const BASE = "https://discord.com/api/v9"

export class DiscordError extends Error {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "User-Agent": "discord-mcp/1.0", Accept: "application/json" },
    signal: AbortSignal.timeout(15000),
  })
  if (res.status === 404) throw new DiscordError("Not found (bad invite code or widget disabled).")
  if (res.status === 403) throw new DiscordError("Forbidden (server widget is disabled).")
  if (res.status === 429) throw new DiscordError("Discord rate limit hit; wait a minute and retry.")
  if (!res.ok) throw new DiscordError(`Discord error ${res.status}`)
  return (await res.json()) as T
}

export interface InviteInfo {
  code: string
  guildId?: string
  guildName?: string
  description?: string
  members?: number
  online?: number
  channel?: string
  expires?: string
}

export async function lookupInvite(code: string): Promise<InviteInfo> {
  const clean = code.trim().replace(/^https?:\/\/(www\.)?discord(\.com\/invite|\.gg)\//, "").split(/[?/]/)[0]
  if (!clean) throw new DiscordError(`Not an invite code or URL: "${code}".`)
  const inv = await getJson<Raw>(`/invites/${encodeURIComponent(clean)}?with_counts=true&with_expiration=true`)
  const g: Raw = inv.guild ?? {}
  const ch: Raw = inv.channel ?? {}
  return {
    code: String(inv.code ?? clean),
    guildId: g.id,
    guildName: g.name,
    description: g.description,
    members: typeof inv.approximate_member_count === "number" ? inv.approximate_member_count : undefined,
    online: typeof inv.approximate_presence_count === "number" ? inv.approximate_presence_count : undefined,
    channel: ch.name,
    expires: inv.expires_at ? String(inv.expires_at).slice(0, 10) : undefined,
  }
}

export interface WidgetInfo {
  guildId: string
  name?: string
  online?: number
  channels: string[]
  invite?: string
}

export async function getWidget(guildId: string): Promise<WidgetInfo> {
  if (!/^\d+$/.test(guildId.trim())) throw new DiscordError(`Guild id must be numeric, got "${guildId}".`)
  const w = await getJson<Raw>(`/guilds/${guildId.trim()}/widget.json`)
  const channels: Raw[] = Array.isArray(w.channels) ? w.channels : []
  const members: Raw[] = Array.isArray(w.members) ? w.members : []
  return {
    guildId: guildId.trim(),
    name: w.name,
    online: members.length || undefined,
    channels: channels.map((c) => String(c.name)).slice(0, 15),
    invite: w.instant_invite ? `https://discord.gg/${w.instant_invite}` : undefined,
  }
}

export function formatInvite(inv: InviteInfo): string {
  const lines = [
    `discord.gg/${inv.code}${inv.guildName ? ` — ${inv.guildName}` : ""}`,
    inv.description ? `${inv.description}` : "",
    inv.members !== undefined ? `Members: ${inv.members.toLocaleString()}${inv.online !== undefined ? ` (${inv.online.toLocaleString()} online)` : ""}` : "",
    inv.channel ? `Channel: #${inv.channel}` : "",
    inv.guildId ? `Guild id: ${inv.guildId}` : "",
    inv.expires ? `Expires: ${inv.expires}` : "Never expires",
  ].filter(Boolean)
  return lines.join("\n")
}

export function formatWidget(w: WidgetInfo): string {
  const lines = [
    `${w.name ?? "Server"} [${w.guildId}]`,
    w.online !== undefined ? `${w.online} online now` : "",
    w.channels.length ? `Top channels: ${w.channels.join(", ")}` : "",
    w.invite ? `Join: ${w.invite}` : "",
  ].filter(Boolean)
  return lines.join("\n")
}

export interface WidgetMember {
  username?: string
  status?: string
  game?: string
}

export async function widgetMembers(guildId: string): Promise<WidgetMember[]> {
  if (!/^\d+$/.test(guildId.trim())) throw new DiscordError(`Guild id must be numeric, got "${guildId}".`)
  const w = await getJson<Raw>(`/guilds/${guildId.trim()}/widget.json`)
  const members: Raw[] = Array.isArray(w.members) ? w.members : []
  return members.slice(0, 25).map((m) => ({
    username: typeof m.username === "string" ? m.username : undefined,
    status: typeof m.status === "string" ? m.status : undefined,
    game: typeof m.game?.name === "string" ? m.game.name : undefined,
  }))
}

export function formatMembers(members: WidgetMember[], guildId: string): string {
  if (!members.length) return `No online members visible for ${guildId}.`
  return `Online now (${members.length} shown):\n` + members.map((m, i) => `${i + 1}. ${m.username ?? "?"} [${m.status ?? "?"}]${m.game ? ` playing ${m.game}` : ""}`).join("\n")
}
