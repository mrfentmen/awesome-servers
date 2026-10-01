import * as cheerio from "cheerio"
import type { AssetEntry, ConsoleEntry, GameEntry, ResourceType } from "./types.js"
import { RESOURCES } from "./types.js"

const USER_AGENT = "Mozilla/5.0 (compatible; VGResourceMCP/1.0; +https://github.com/vg-resource-mcp)"
const RATE_LIMIT_MS = 500

let lastRequest = 0
const cache = new Map<string, { data: unknown; expires: number }>()
const CACHE_TTL = 5 * 60 * 1000

async function rateLimit(): Promise<void> {
  const now = Date.now()
  const elapsed = now - lastRequest
  if (elapsed < RATE_LIMIT_MS) {
    await new Promise((r) => setTimeout(r, RATE_LIMIT_MS - elapsed))
  }
  lastRequest = Date.now()
}

async function fetchHtml(url: string): Promise<cheerio.CheerioAPI> {
  const cached = cache.get(url)
  if (cached && cached.expires > Date.now()) {
    return cached.data as cheerio.CheerioAPI
  }

  await rateLimit()
  const res = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "text/html",
    },
  })

  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  const html = await res.text()
  const $ = cheerio.load(html)
  cache.set(url, { data: $, expires: Date.now() + CACHE_TTL })
  return $
}

export async function getConsoles(resource: ResourceType): Promise<ConsoleEntry[]> {
  const { baseUrl } = RESOURCES[resource]
  const $ = await fetchHtml(`${baseUrl}/browse/games/`)

  const consoles: ConsoleEntry[] = []
  $('a[href*="/browse/games/?consoles%5B%5D="]').each((_, el) => {
    const $el = $(el)
    const name = $el.text().trim()
    const href = $el.attr("href") || ""
    const match = href.match(/consoles%5B%5D=(\d+)/)
    if (name && match) {
      consoles.push({ name, slug: match[1] })
    }
  })

  if (consoles.length === 0) {
    $('a[href*="/"]').each((_, el) => {
      const $el = $(el)
      const href = $el.attr("href") || ""
      const match = href.match(/^\/([a-z0-9_]+)\/?$/)
      if (match) {
        const name = $el.text().trim()
        if (
          name &&
          name.length > 1 &&
          !["browse", "stats", "help", "contact", "page", "user", "process", "update", "random", "comments"].includes(
            match[1],
          )
        ) {
          consoles.push({ name, slug: match[1] })
        }
      }
    })
  }

  return consoles
}

export async function getGames(resource: ResourceType, consoleSlug: string, page = 1): Promise<GameEntry[]> {
  const { baseUrl } = RESOURCES[resource]
  const url = page === 1 ? `${baseUrl}/${consoleSlug}/` : `${baseUrl}/${consoleSlug}/?page=${page}`

  const $ = await fetchHtml(url)
  const games: GameEntry[] = []

  $("a").each((_, el) => {
    const $el = $(el)
    const href = $el.attr("href") || ""
    const match = href.match(new RegExp(`^/${consoleSlug}/([a-z0-9_]+)/?$`))
    if (match) {
      const name = $el.text().trim()
      if (name && name.length > 1) {
        const img = $el.find("img")
        games.push({
          name,
          slug: match[1],
          console: consoleSlug,
          imageUrl: img.attr("src"),
        })
      }
    }
  })

  return games
}

export async function getGameAssets(
  resource: ResourceType,
  consoleSlug: string,
  gameSlug: string,
): Promise<AssetEntry[]> {
  const { baseUrl } = RESOURCES[resource]
  const $ = await fetchHtml(`${baseUrl}/${consoleSlug}/${gameSlug}/`)
  const assets: AssetEntry[] = []

  $("a").each((_, el) => {
    const $el = $(el)
    const href = $el.attr("href") || ""
    const match = href.match(new RegExp(`^/${consoleSlug}/${gameSlug}/asset/(\\d+)/?$`))
    if (match) {
      const name = $el.text().trim()
      if (name && name.length > 1) {
        const img = $el.find("img")
        assets.push({
          name,
          id: match[1],
          game: gameSlug,
          console: consoleSlug,
          thumbnailUrl: img.attr("src"),
          assetUrl: `${baseUrl}${href}`,
          resource,
        })
      }
    }
  })

  return assets
}

export async function getAssetDetail(assetUrl: string): Promise<Partial<AssetEntry>> {
  const $ = await fetchHtml(assetUrl)
  const detail: Partial<AssetEntry> = { assetUrl }

  $("a").each((_, el) => {
    const href = $(el).attr("href") || ""
    if (
      href.includes("/media/") ||
      href.includes(".png") ||
      href.includes(".zip") ||
      href.includes(".obj") ||
      href.includes(".fbx")
    ) {
      if (!detail.downloadUrl) {
        detail.downloadUrl = href.startsWith("http") ? href : `${new URL(assetUrl).origin}${href}`
      }
    }
  })

  const pageText = $.text()
  const dateMatch = pageText.match(/(\d{4}-\d{2}-\d{2})/)
  if (dateMatch) detail["uploadDate" as keyof typeof detail] = dateMatch[1] as never

  return detail
}

export async function searchAssets(resource: ResourceType, query: string): Promise<AssetEntry[]> {
  const { baseUrl } = RESOURCES[resource]
  const $ = await fetchHtml(`${baseUrl}/browse/assets/?q=${encodeURIComponent(query)}`)
  const assets: AssetEntry[] = []

  $("a").each((_, el) => {
    const $el = $(el)
    const href = $el.attr("href") || ""
    const match = href.match(/^\/([a-z0-9_]+)\/([a-z0-9_]+)\/asset\/(\d+)\/?$/)
    if (match) {
      const name = $el.text().trim()
      if (name && name.length > 1) {
        const img = $el.find("img")
        assets.push({
          name,
          id: match[3],
          game: match[2],
          console: match[1],
          thumbnailUrl: img.attr("src"),
          assetUrl: `${baseUrl}${href}`,
          resource,
        })
      }
    }
  })

  return assets
}

export async function getLatestAssets(resource: ResourceType, limit = 20): Promise<AssetEntry[]> {
  const { baseUrl } = RESOURCES[resource]
  const $ = await fetchHtml(`${baseUrl}/browse/assets/?sortby=3&dir=1`)
  const assets: AssetEntry[] = []

  $("a").each((_, el) => {
    if (assets.length >= limit) return
    const $el = $(el)
    const href = $el.attr("href") || ""
    const match = href.match(/^\/([a-z0-9_]+)\/([a-z0-9_]+)\/asset\/(\d+)\/?$/)
    if (match) {
      const name = $el.text().trim()
      if (name && name.length > 1) {
        const img = $el.find("img")
        assets.push({
          name,
          id: match[3],
          game: match[2],
          console: match[1],
          thumbnailUrl: img.attr("src"),
          assetUrl: `${baseUrl}${href}`,
          resource,
        })
      }
    }
  })

  return assets
}

export async function getPopularAssets(resource: ResourceType, limit = 20): Promise<AssetEntry[]> {
  const { baseUrl } = RESOURCES[resource]
  const $ = await fetchHtml(`${baseUrl}/browse/assets/?sortby=1&dir=1`)
  const assets: AssetEntry[] = []

  $("a").each((_, el) => {
    if (assets.length >= limit) return
    const $el = $(el)
    const href = $el.attr("href") || ""
    const match = href.match(/^\/([a-z0-9_]+)\/([a-z0-9_]+)\/asset\/(\d+)\/?$/)
    if (match) {
      const name = $el.text().trim()
      if (name && name.length > 1) {
        const img = $el.find("img")
        assets.push({
          name,
          id: match[3],
          game: match[2],
          console: match[1],
          thumbnailUrl: img.attr("src"),
          assetUrl: `${baseUrl}${href}`,
          resource,
        })
      }
    }
  })

  return assets
}

export async function getRandomAsset(resource: ResourceType): Promise<AssetEntry | null> {
  const { baseUrl } = RESOURCES[resource]
  const $ = await fetchHtml(`${baseUrl}/random/`)

  let assetUrl = ""
  $("a").each((_, el) => {
    const href = $(el).attr("href") || ""
    const match = href.match(/^\/([a-z0-9_]+)\/([a-z0-9_]+)\/asset\/(\d+)\/?$/)
    if (match && !assetUrl) {
      assetUrl = `${baseUrl}${href}`
    }
  })

  if (!assetUrl) return null

  const urlMatch = assetUrl.match(/\/([a-z0-9_]+)\/([a-z0-9_]+)\/asset\/(\d+)\//)
  if (!urlMatch) return null

  return {
    name: "Random Asset",
    id: urlMatch[3],
    game: urlMatch[2],
    console: urlMatch[1],
    assetUrl,
    resource,
  }
}

export async function downloadAsset(
  url: string,
  destPath: string,
): Promise<{ success: boolean; path: string; size: number }> {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  const buf = Buffer.from(await res.arrayBuffer())
  const { writeFile } = await import("node:fs/promises")
  const { dirname } = await import("node:path")
  const { mkdir } = await import("node:fs/promises")
  await mkdir(dirname(destPath), { recursive: true })
  await writeFile(destPath, buf)
  return { success: true, path: destPath, size: buf.length }
}

export async function getDownloadUrl(assetPageUrl: string): Promise<string> {
  const $ = await fetchHtml(assetPageUrl)

  let downloadUrl = ""
  $("a").each((_, el) => {
    const href = $(el).attr("href") || ""
    const text = $(el).text().toLowerCase()
    if (
      (href.includes("/media/") || href.match(/\.(png|jpg|gif|zip|obj|fbx|wav|mp3|ogg)$/i)) &&
      (text.includes("download") || href.includes("/media/"))
    ) {
      if (!downloadUrl) {
        downloadUrl = href.startsWith("http") ? href : `${new URL(assetPageUrl).origin}${href}`
      }
    }
  })

  if (!downloadUrl) {
    $("img").each((_, el) => {
      const src = $(el).attr("src") || ""
      if (src.includes("/media/") && !downloadUrl) {
        downloadUrl = src.startsWith("http") ? src : `${new URL(assetPageUrl).origin}${src}`
      }
    })
  }

  if (!downloadUrl) {
    $("source").each((_, el) => {
      const src = $(el).attr("src") || ""
      if (src && !downloadUrl) {
        downloadUrl = src.startsWith("http") ? src : `${new URL(assetPageUrl).origin}${src}`
      }
    })
  }

  return downloadUrl
}

export async function crossReference(gameName: string): Promise<{ resource: ResourceType; assets: AssetEntry[] }[]> {
  const results: { resource: ResourceType; assets: AssetEntry[] }[] = []
  const resources: ResourceType[] = ["sprites", "models", "textures", "sounds"]

  for (const resource of resources) {
    const assets = await searchAssets(resource, gameName)
    if (assets.length > 0) {
      results.push({ resource, assets: assets.slice(0, 10) })
    }
  }

  return results
}
