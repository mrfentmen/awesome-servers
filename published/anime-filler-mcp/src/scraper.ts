/**
 * animefillerlist.com scraper.
 *
 * The site tracks which anime episodes are manga canon, mixed
 * canon/filler, anime canon, or pure filler. No official API, so this
 * is a polite HTML scraper.
 *
 * Show pages contain an episode table — one <tr id="eps-N"> per episode
 * with a Number cell, a Title cell, and a Type cell (Manga Canon,
 * Mixed Canon/Filler, Anime Canon, Filler...). We parse that table.
 */

import * as cheerio from "cheerio"

const BASE = "https://www.animefillerlist.com"
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
  "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"

export class ScrapeError extends Error {}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.9",
    },
  })
  if (!res.ok) {
    throw new ScrapeError(`HTTP ${res.status} fetching ${url}`)
  }
  return await res.text()
}

export interface AnimeResult {
  title: string
  slug: string
  url: string
}

export interface Episode {
  number: number
  title: string
  category: string
  date?: string
}

export interface EpisodeCategory {
  label: string
  episodes: number[]
}

export interface ShowInfo {
  title: string
  slug: string
  url: string
  totalEpisodes?: number
  status?: string
  categories: EpisodeCategory[]
  episodes: Episode[]
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export async function searchAnime(query: string): Promise<AnimeResult[]> {
  const html = await fetchHtml(`${BASE}/search/node?keys=${encodeURIComponent(query)}`)
  const $ = cheerio.load(html)

  const results: AnimeResult[] = []
  $(".search-results a, ol li h3 a, li h3 a").each((_, el) => {
    const href = $(el).attr("href") ?? ""
    const m = /\/shows\/([\w-]+)/.exec(href)
    if (!m) return
    const title = $(el).text().trim()
    if (!title) return
    results.push({ title, slug: m[1], url: `${BASE}/shows/${m[1]}` })
  })

  if (results.length === 0) {
    $('a[href*="/shows/"]').each((_, el) => {
      const href = $(el).attr("href") ?? ""
      const m = /\/shows\/([\w-]+)/.exec(href)
      if (!m) return
      const title = $(el).text().trim()
      if (!title || results.some((r) => r.slug === m[1])) return
      results.push({ title, slug: m[1], url: `${BASE}/shows/${m[1]}` })
    })
  }

  return dedupe(results).slice(0, 10)
}

// ---------------------------------------------------------------------------
// Show page
// ---------------------------------------------------------------------------

export async function getShow(slug: string): Promise<ShowInfo> {
  const url = `${BASE}/shows/${slug}`
  const html = await fetchHtml(url)
  const $ = cheerio.load(html)

  const rawTitle = $("h1").first().text().trim() || slug.replace(/-/g, " ")
  const title = rawTitle.replace(/\s*Filler List\s*$/i, "").trim()

  const headerText = $("#main-content, .content, main").first().text()
  const status = /Status:\s*([^,\n]+)/i.exec(headerText)

  // The episode table is the ground truth.
  const episodes: Episode[] = []
  $("tr[id^='eps-']").each((_, el) => {
    const $el = $(el)
    const number = parseInt($el.find("td.Number").text().trim(), 10)
    const category = $el.find("td.Type span, td.Type").first().text().trim()
    if (!number || !category) return
    episodes.push({
      number,
      category,
      title: $el.find("td.Title").text().trim() || "?",
      date: $el.find("td.Date").text().trim() || undefined,
    })
  })

  // Group by category label.
  const byLabel = new Map<string, number[]>()
  for (const ep of episodes) {
    const arr = byLabel.get(ep.category) ?? []
    arr.push(ep.number)
    byLabel.set(ep.category, arr)
  }
  const categories: EpisodeCategory[] = [...byLabel.entries()].map(
    ([label, nums]) => ({ label, episodes: nums.sort((a, b) => a - b) })
  )

  // If the table was empty, fall back to the condensed quick-list.
  if (episodes.length === 0) {
    $("#Condensed strong").each((_, el) => {
      const label = $(el).text().replace(/:$/, "").trim()
      if (!label) return
      const parsed = parseEpisodeText($(el).parent().text())
      categories.push({ label, episodes: parsed.numbers })
    })
  }

  const maxEp = episodes.reduce((m, e) => Math.max(m, e.number), 0)

  return {
    title,
    slug,
    url,
    totalEpisodes: maxEp || undefined,
    status: status?.[1]?.trim(),
    categories,
    episodes,
  }
}

export function verdict(info: ShowInfo, episode: number): string {
  if (episode <= 0) return "Episode numbers start at 1."
  const total = info.totalEpisodes
  if (total && episode > total) {
    return `Episode ${episode} is past the show's ${total} episodes.`
  }

  const ep = info.episodes.find((e) => e.number === episode)
  if (ep) {
    const verdicts: Record<string, string> = {
      "Manga Canon": "MANGA CANON — essential, do not skip",
      "Mixed Canon/Filler": "MIXED CANON/FILLER — watch it, half of it counts",
      "Anime Canon": "ANIME CANON — watchable, canon to the anime universe",
      Filler: "FILLER — skippable, safe to skip",
      "Semi-Filler": "SEMI-FILLER — partial skip",
    }
    const v =
      verdicts[ep.category] ??
      (ep.category.includes("Filler") ? "FILLER-ish" : "CANON-ish")
    return (
      `Episode ${episode} of ${info.title} is ${v}.` +
      (ep.title !== "?" ? `\nTitle: "${ep.title}"` : "") +
      (ep.date ? ` (aired ${ep.date})` : "")
    )
  }

  if (info.episodes.length > 0) {
    return `Episode ${episode} of ${info.title} isn't in the tracked list (episodes go up to ${info.totalEpisodes}).`
  }
  return `No episode data could be parsed for ${info.title}. The site's layout may have changed.`
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseEpisodeText(raw: string): { numbers: number[]; display: string } {
  const display = raw.replace(/\s+/g, " ").trim().slice(0, 300)
  const numbers = new Set<number>()
  const tokenRe = /(\d+)\s*-\s*(\d+)|(\d+)/g
  let m: RegExpExecArray | null
  while ((m = tokenRe.exec(raw)) !== null) {
    if (m[1] !== undefined && m[2] !== undefined) {
      const lo = Math.min(parseInt(m[1], 10), parseInt(m[2], 10))
      const hi = Math.max(parseInt(m[1], 10), parseInt(m[2], 10))
      for (let e = lo; e <= hi; e++) numbers.add(e)
    } else if (m[3] !== undefined) {
      numbers.add(parseInt(m[3], 10))
    }
  }
  return { numbers: [...numbers].sort((a, b) => a - b), display }
}

function dedupe(results: AnimeResult[]): AnimeResult[] {
  const seen = new Set<string>()
  return results.filter((r) => {
    if (seen.has(r.slug)) return false
    seen.add(r.slug)
    return true
  })
}
