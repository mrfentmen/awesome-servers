/**
 * Telnet BBS Guide client. Scrapes the directory of still running retro
 * BBSes (the sites you dial into with telnet). The listing page renders
 * each BBS as an <h3> heading followed by an info table (Telnet address,
 * software, connection type, location).
 */
const BASE = "https://www.telnetbbsguide.com"

export class BbsError extends Error {}

export interface BbsEntry {
  name: string
  telnet: string[]
  ssh?: string[]
  software?: string
  connection?: string[]
  location?: string
  url: string
}

async function fetchText(path: string): Promise<string> {
  // The site is a big WordPress page and occasionally slow or briefly
  // down, so bound the request instead of hanging the MCP call.
  const res = await fetch(`${BASE}${path}`, {
    headers: { "User-Agent": "telnetbbs-mcp/1.0", Accept: "text/html" },
    signal: AbortSignal.timeout(12000),
  })
  if (!res.ok) throw new BbsError(`Telnet BBS Guide error ${res.status}`)
  return res.text()
}

/** Split the listing into per-BBS blocks, keyed by the h3 heading. */
function splitBlocks(html: string): { name: string; block: string }[] {
  const out: { name: string; block: string }[] = []
  const re = /<h3[^>]*>([^<]+)<\/h3>([\s\S]*?)(?=<h3[^>]*>|<\/body>|$)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    const name = m[1].trim()
    if (name) out.push({ name, block: m[2] })
  }
  return out
}

function cellValue(block: string, key: string): string | undefined {
  const re = new RegExp(`<th>${key}:</th><td>([\\s\\S]*?)</td>`, "i")
  const m = block.match(re)
  if (!m) return undefined
  return m[1]
    .replace(/<a[^>]*>([^<]*)<\/a>/g, "$1")
    .replace(/<[^>]+>/g, "")
    .trim()
}

export function parseListing(html: string): BbsEntry[] {
  return splitBlocks(html).map(({ name, block }) => {
    const telnet: string[] = []
    const ssh: string[] = []
    const re = /href="(telnet|ssh):\/\/([^"]+)"/g
    let m: RegExpExecArray | null
    while ((m = re.exec(block)) !== null) {
      if (m[1] === "telnet") telnet.push(m[2])
      else ssh.push(m[2])
    }
    return {
      name,
      telnet: [...new Set(telnet)],
      ssh: [...new Set(ssh)],
      software: cellValue(block, "Software"),
      connection: (cellValue(block, "Connection") || "").split(",").map((s) => s.trim()).filter(Boolean),
      location: cellValue(block, "Location"),
      url: `${BASE}/bbs/${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}/`,
    }
  })
}

export async function listAll(): Promise<BbsEntry[]> {
  const html = await fetchText("/bbs/")
  return parseListing(html)
}

export function formatBbs(b: BbsEntry, index?: number): string {
  const head = `${index !== undefined ? `${index + 1}. ` : ""}${b.name}`
  const lines = [
    head,
    b.telnet.length ? `Telnet: ${b.telnet.join(", ")}` : "",
    b.ssh?.length ? `SSH: ${b.ssh.join(", ")}` : "",
    b.software ? `Software: ${b.software}` : "",
    b.connection?.length ? `Connection: ${b.connection.join(", ")}` : "",
    b.location ? `Location: ${b.location}` : "",
    b.url,
  ].filter(Boolean)
  return lines.join("\n")
}

// ---- muxB tools:

// the guide is a big WordPress page that occasionally takes longer than the
// 12s bound fetchText uses, so retry once before giving up
async function listing(): Promise<BbsEntry[]> {
  try {
    return await listAll()
  } catch {
    return await listAll()
  }
}

export interface SoftwareCensusArgs {
  limit?: number;
}

export async function softwareCensus(args: SoftwareCensusArgs): Promise<string> {
  const limit = Math.max(1, Math.min(Number(args?.limit ?? 20) || 20, 60))
  const all = (await listing()).filter((b) => b.telnet.length > 0)
  if (!all.length) return "The guide listed no BBSes with a telnet address."
  const counts = new Map<string, number>()
  for (const b of all) {
    const key = (b.software ?? "").trim()
    if (!key) continue
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  const rows = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  if (!rows.length) return "The guide reported no software field for any listed BBS."
  const top = rows.slice(0, limit)
  return `BBS software in the Telnet BBS Guide (${rows.length} distinct packages across ${all.length} listed systems, showing ${top.length}):\n` +
    top.map(([name, n], i) => `${i + 1}. ${name}: ${n} system${n === 1 ? "" : "s"}`).join("\n")
}

export interface BbsStatsArgs {}

export async function bbsStats(_args: BbsStatsArgs): Promise<string> {
  const all = (await listing()).filter((b) => b.telnet.length > 0)
  if (!all.length) return "The guide listed no BBSes with a telnet address."
  const telnet = all.length
  const alsoSsh = all.filter((b) => (b.ssh ?? []).length > 0).length
  const withLocation = all.filter((b) => (b.location ?? "").trim()).length
  const locations = new Set(
    all.map((b) => (b.location ?? "").trim()).filter((l) => l.length > 0),
  )
  const connectionKinds = new Map<string, number>()
  for (const b of all) {
    for (const c of b.connection ?? []) {
      if (!c.trim()) continue
      connectionKinds.set(c.trim(), (connectionKinds.get(c.trim()) ?? 0) + 1)
    }
  }
  const connRows = [...connectionKinds.entries()].sort((a, b) => b[1] - a[1])
  return [
    `Telnet BBS Guide census (${all.length} listed systems):`,
    `Systems with a telnet address: ${telnet}`,
    `Systems that also list an SSH address: ${alsoSsh}`,
    `Systems with a location recorded: ${withLocation}`,
    `Distinct locations: ${locations.size}`,
    `Connection types: ${connRows.length ? connRows.map(([k, n]) => `${k} (${n})`).join(", ") : "none reported"}`,
    `Most common software: ${softwareLeader(all)}`,
  ].join("\n")
}

const softwareLeader = (all: BbsEntry[]): string => {
  const counts = new Map<string, number>()
  for (const b of all) {
    const key = (b.software ?? "").trim()
    if (key) counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  const best = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]
  return best ? `${best[0]} with ${best[1]} system${best[1] === 1 ? "" : "s"}` : "not reported"
}
