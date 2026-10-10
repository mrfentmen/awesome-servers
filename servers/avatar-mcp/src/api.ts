const BASE = "https://api.dicebear.com/9.x"
const UA = "mrfentmen-avatar-mcp/1.0 (https://github.com/mrfentmen)"
export class AvatarError extends Error {}

const STYLES = ["initials", "pixel-art", "lorelei", "bottts", "adventurer", "fun-emoji", "notionists", "thumbs"]

export async function initialsAvatar(args: { name?: string; style?: string }): Promise<string> {
  const name = (args.name ?? "").trim()
  if (!name) throw new AvatarError("Provide a name")
  const style = (args.style ?? "initials").toLowerCase()
  if (!STYLES.includes(style)) throw new AvatarError(`Style must be one of: ${STYLES.join(", ")}`)
  const res = await fetch(`${BASE}/${style}/svg?seed=${encodeURIComponent(name)}`, {
    headers: { "User-Agent": UA },
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new AvatarError(`DiceBear error ${res.status}`)
  const svg = await res.text()
  return `Avatar SVG for ${name} (${style}):\n${svg.slice(0, 500)}${svg.length > 500 ? "\n[...]" : ""}`
}

export async function avatarUrl(args: { name?: string; style?: string }): Promise<string> {
  const name = (args.name ?? "").trim()
  if (!name) throw new AvatarError("Provide a name")
  const style = (args.style ?? "initials").toLowerCase()
  return `${BASE}/${style}/svg?seed=${encodeURIComponent(name)}`
}

// ---- muxA tools:
const AVATAR_FORMATS = ["svg", "png", "webp", "avif", "jpg"]
// Every style below was probed live against the 9.x API. The module's own
// STYLES list is shorter and omits avataaars, big-ears, glass, icons,
// identicon, dylan, croodles and the rest.
const AVATAR_STYLES = [
  "initials", "pixel-art", "lorelei", "bottts", "adventurer", "fun-emoji",
  "notionists", "thumbs", "avataaars", "big-ears", "big-smile", "croodles",
  "dylan", "glass", "icons", "identicon", "miniavs", "open-peeps",
  "personas", "rings", "shapes",
]

async function avatarReachable(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      headers: { "User-Agent": UA },
      signal: AbortSignal.timeout(15000),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function avatarStyleCatalog(args: Record<string, never>): Promise<string> {
  const links = AVATAR_STYLES.map((style) => ({ style, url: `${BASE}/${style}/svg?seed=probe` }))
  const checks = await Promise.all(links.map((l) => avatarReachable(l.url)))
  const up = checks.filter(Boolean).length
  return [
    `DiceBear 9.x styles reachable right now: ${up} of ${links.length}`,
    ...links.map((l, i) => `  ${checks[i] ? "ok  " : "DOWN"} ${l.style}`),
    `Output formats: ${AVATAR_FORMATS.join(", ")}`,
  ].join("\n")
}
