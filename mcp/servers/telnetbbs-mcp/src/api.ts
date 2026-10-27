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
