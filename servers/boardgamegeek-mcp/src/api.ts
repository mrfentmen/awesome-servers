/**
 * BoardGameGeek XML API2 client, keyless.
 * Docs: https://boardgamegeek.com/wiki/page/BGG_XML_API2
 * The API sometimes answers 202 while it prepares the response,
 * so callers retry a few times before giving up.
 */
const BASE = "https://boardgamegeek.com/xmlapi2"
const UA = "boardgamegeek-mcp/1.0"

export class BggError extends Error {}

export interface GameSummary {
  id: string
  name: string
  yearPublished?: string
  type?: string
}

export interface GameDetails extends GameSummary {
  description?: string
  minPlayers?: string
  maxPlayers?: string
  playingTime?: string
  minPlayTime?: string
  maxPlayTime?: string
  minAge?: string
  categories?: string[]
  mechanics?: string[]
  designers?: string[]
  artists?: string[]
  publishers?: string[]
  usersRated?: string
  average?: string
  bayesAverage?: string
  rank?: string
}

async function fetchXml(path: string, retries = 3): Promise<string> {
  let lastStatus = 0
  for (let attempt = 0; attempt < retries; attempt++) {
    const headers: Record<string, string> = { "User-Agent": UA }
    const token = process.env.BGG_API_TOKEN?.trim()
    if (token) headers.Authorization = `Bearer ${token}`
    const res = await fetch(`${BASE}${path}`, {
      headers,
      signal: AbortSignal.timeout(20000),
    })
    lastStatus = res.status
    if (res.status === 202) {
      await new Promise((r) => setTimeout(r, 3000))
      continue
    }
    if (res.status === 401 || res.status === 403) {
      throw new BggError(
        "BoardGameGeek refused the request (HTTP 401/403). Since 2025 the XML API needs a token: set BGG_API_TOKEN. It also throttles datacenter IPs; try again later."
      )
    }
    if (!res.ok) throw new BggError(`BoardGameGeek error ${res.status}`)
    return await res.text()
  }
  throw new BggError(`BoardGameGeek is still preparing results (HTTP ${lastStatus}); try again in a few seconds.`)
}

function attr(block: string, name: string): string | undefined {
  const m = block.match(new RegExp(`${name}="([^"]*)"`))
  return m ? decodeEntities(m[1]) : undefined
}

export function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
}

function itemBlocks(xml: string): string[] {
  const out: string[] = []
  const re = /<item[\s\S]*?<\/item>|<item[\s\S]*?\/>/g
  let m: RegExpExecArray | null
  while ((m = re.exec(xml)) !== null) out.push(m[0])
  return out
}

export function parseSearch(xml: string): GameSummary[] {
  return itemBlocks(xml).map((b) => {
    const nameMatch = b.match(/<name[^>]*value="([^"]*)"/)
    const yearMatch = b.match(/<yearpublished[^>]*value="([^"]*)"/)
    return {
      id: attr(b, "id") ?? "",
      name: nameMatch ? decodeEntities(nameMatch[1]) : "(unknown)",
      yearPublished: yearMatch ? yearMatch[1] : undefined,
      type: attr(b, "type"),
    }
  }).filter((g) => g.id)
}

export function parseThing(xml: string): GameDetails | null {
  const blocks = itemBlocks(xml)
  if (blocks.length === 0) return null
  const b = blocks[0]
  const primary = b.match(/<name[^>]*type="primary"[^>]*value="([^"]*)"/)
  const anyName = b.match(/<name[^>]*value="([^"]*)"/)
  const descMatch = b.match(/<description>([\s\S]*?)<\/description>/)
  const linksOf = (type: string): string[] => {
    const out: string[] = []
    const re = new RegExp(`<link[^>]*type="${type}"[^>]*value="([^"]*)"`, "g")
    let m: RegExpExecArray | null
    while ((m = re.exec(b)) !== null) out.push(decodeEntities(m[1]))
    return out
  }
  const stat = (tag: string): string | undefined => {
    const m = b.match(new RegExp(`<${tag}[^>]*value="([^"]*)"`))
    return m ? m[1] : undefined
  }
  const rankMatch = b.match(/<rank[^>]*type="boardgame"[^>]*value="([^"]*)"/)
  const desc = descMatch
    ? decodeEntities(descMatch[1]).replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()
    : undefined
  return {
    id: attr(b, "id") ?? "",
    name: primary ? decodeEntities(primary[1]) : anyName ? decodeEntities(anyName[1]) : "(unknown)",
    type: attr(b, "type"),
    yearPublished: stat("yearpublished"),
    description: desc ? (desc.length > 600 ? desc.slice(0, 600) + "..." : desc) : undefined,
    minPlayers: stat("minplayers"),
    maxPlayers: stat("maxplayers"),
    playingTime: stat("playingtime"),
    minPlayTime: stat("minplaytime"),
    maxPlayTime: stat("maxplaytime"),
    minAge: stat("minage"),
    categories: linksOf("boardgamecategory"),
    mechanics: linksOf("boardgamemechanic"),
    designers: linksOf("boardgamedesigner"),
    artists: linksOf("boardgameartist"),
    publishers: linksOf("boardgamepublisher"),
    usersRated: stat("usersrated"),
    average: stat("average"),
    bayesAverage: stat("bayesaverage"),
    rank: rankMatch ? rankMatch[1] : undefined,
  }
}

export async function searchGames(query: string, exact = false, limit = 5): Promise<GameSummary[]> {
  const xml = await fetchXml(
    `/search?query=${encodeURIComponent(query)}&type=boardgame,boardgameexpansion${exact ? "&exact=1" : ""}`
  )
  return parseSearch(xml).slice(0, limit)
}

export async function getGame(id: string): Promise<GameDetails | null> {
  const clean = id.trim()
  if (!/^\d+$/.test(clean)) throw new BggError(`Game id must be numeric, got "${id}". Search first to find the id.`)
  const xml = await fetchXml(`/thing?id=${clean}&stats=1`)
  return parseThing(xml)
}

export async function hotGames(limit = 10): Promise<GameSummary[]> {
  const xml = await fetchXml("/hot?type=boardgame")
  const out: GameSummary[] = []
  const re = /<item[^>]*id="([^"]*)"[^>]*rank="([^"]*)"[^>]*>[\s\S]*?<name[^>]*value="([^"]*)"[\s\S]*?<yearpublished[^>]*value="([^"]*)"?/g
  let m: RegExpExecArray | null
  while ((m = re.exec(xml)) !== null && out.length < limit) {
    out.push({
      id: m[1],
      name: `${decodeEntities(m[3])} (#${m[2]} hot)`,
      yearPublished: m[4] || undefined,
    })
  }
  return out
}

export function formatSummary(g: GameSummary, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  const year = g.yearPublished ? ` (${g.yearPublished})` : ""
  return `${prefix}[${g.id}] ${g.name}${year}`
}

export function formatDetails(g: GameDetails): string {
  const lines = [
    `[${g.id}] ${g.name}${g.yearPublished ? ` (${g.yearPublished})` : ""}`,
    g.description ? `About: ${g.description}` : "",
    g.minPlayers || g.maxPlayers ? `Players: ${g.minPlayers ?? "?"}-${g.maxPlayers ?? "?"}` : "",
    g.playingTime ? `Playing time: ${g.playingTime} min` : "",
    g.minAge ? `Min age: ${g.minAge}+` : "",
    g.average || g.bayesAverage
      ? `Rating: ${g.average ?? "?"} avg / ${g.bayesAverage ?? "?"} geek (${g.usersRated ?? "?"} ratings)` +
        (g.rank ? `, rank #${g.rank}` : "")
      : "",
    g.categories?.length ? `Categories: ${g.categories.slice(0, 8).join(", ")}` : "",
    g.mechanics?.length ? `Mechanics: ${g.mechanics.slice(0, 8).join(", ")}` : "",
    g.designers?.length ? `Designers: ${g.designers.slice(0, 5).join(", ")}` : "",
    g.publishers?.length ? `Publishers: ${g.publishers.slice(0, 5).join(", ")}` : "",
  ].filter(Boolean)
  return lines.join("\n")
}

export interface BggUser {
  username: string
  firstName?: string
  lastName?: string
  yearRegistered?: string
}

export async function getUser(username: string): Promise<BggUser | null> {
  const clean = username.trim()
  if (!clean) throw new BggError("Provide a BGG username.")
  const xml = await fetchXml(`/user?name=${encodeURIComponent(clean)}`)
  const m = xml.match(/<user[^>]*name="([^"]*)"[^>]*>/)
  if (!m) return null
  const tag = (t: string): string | undefined => {
    const x = xml.match(new RegExp(`<${t}[^>]*value="([^"]*)"`))
    return x ? decodeEntities(x[1]) : undefined
  }
  return { username: decodeEntities(m[1]), firstName: tag("firstname"), lastName: tag("lastname"), yearRegistered: tag("yearregistered") }
}

export async function userPlays(username: string, limit = 10): Promise<string[]> {
  const clean = username.trim()
  if (!clean) throw new BggError("Provide a BGG username.")
  const xml = await fetchXml(`/plays?username=${encodeURIComponent(clean)}`)
  const out: string[] = []
  const re = /<play[^>]*date="([^"]*)"[^>]*quantity="([^"]*)"[^>]*>[\s\S]*?<item[^>]*name="([^"]*)"/g
  let m: RegExpExecArray | null
  while ((m = re.exec(xml)) !== null && out.length < limit) {
    out.push(`${m[1]}: ${decodeEntities(m[3])} x${m[2]}`)
  }
  return out
}

export async function userCollection(username: string, own = true, limit = 10): Promise<GameSummary[]> {
  const clean = username.trim()
  if (!clean) throw new BggError("Provide a BGG username.")
  const xml = await fetchXml(`/collection?username=${encodeURIComponent(clean)}${own ? "&own=1" : ""}`)
  if (xml.includes("Invalid username")) throw new BggError(`Invalid BGG username: ${clean}.`)
  return parseSearch(xml).slice(0, limit)
}

export async function guildInfo(id: string): Promise<string> {
  if (!/^\d+$/.test(id.trim())) throw new BggError(`Guild id must be numeric, got "${id}".`)
  const xml = await fetchXml(`/guild?id=${id.trim()}`)
  const name = xml.match(/<name[^>]*value="([^"]*)"/)
  const desc = xml.match(/<description>([\s\S]*?)<\/description>/)
  const members = [...xml.matchAll(/<member[^>]*name="([^"]*)"/g)].map((m) => decodeEntities(m[1]))
  return [`${name ? decodeEntities(name[1]) : `Guild ${id}`}`, desc ? desc[1].replace(/<[^>]+>/g, "").slice(0, 200) : "", members.length ? `Members (${members.length} shown): ${members.slice(0, 10).join(", ")}` : ""].filter(Boolean).join("\n")
}

export async function forumThreads(id: string, limit = 10): Promise<string[]> {
  if (!/^\d+$/.test(id.trim())) throw new BggError(`Forum id must be numeric, got "${id}".`)
  const xml = await fetchXml(`/forum?id=${id.trim()}`)
  const out: string[] = []
  const re = /<thread[^>]*id="([^"]*)"[^>]*subject="([^"]*)"[^>]*numarticles="([^"]*)"/g
  let m: RegExpExecArray | null
  while ((m = re.exec(xml)) !== null && out.length < limit) {
    out.push(`[${m[1]}] ${decodeEntities(m[2])} (${m[3]} posts)`)
  }
  return out
}

export async function threadArticles(id: string, limit = 5): Promise<string[]> {
  if (!/^\d+$/.test(id.trim())) throw new BggError(`Thread id must be numeric, got "${id}".`)
  const xml = await fetchXml(`/thread?id=${id.trim()}`)
  const out: string[] = []
  const re = /<article[^>]*username="([^"]*)"[^>]*>[\s\S]*?<body>([\s\S]*?)<\/body>/g
  let m: RegExpExecArray | null
  while ((m = re.exec(xml)) !== null && out.length < limit) {
    out.push(`${decodeEntities(m[1])}: ${m[2].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().slice(0, 300)}`)
  }
  return out
}

export async function geeklist(id: string, limit = 10): Promise<GameSummary[]> {
  if (!/^\d+$/.test(id.trim())) throw new BggError(`Geeklist id must be numeric, got "${id}".`)
  const xml = await fetchXml(`/geeklist/${id.trim()}`)
  return parseSearch(xml).slice(0, limit)
}
