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
// Filler analysis
// ---------------------------------------------------------------------------

/**
 * The site labels episodes "Manga Canon", "Mixed Canon/Filler", "Anime Canon",
 * "Filler" and "Semi-Filler". Only the labels that are filler and not canon
 * count as skippable, so "Mixed Canon/Filler" stays in the canon side.
 */
function isFillerCategory(category: string): boolean {
  const c = category.toLowerCase()
  return c.includes("filler") && !c.includes("canon")
}

interface FillerRun {
  from: number
  to: number
}

/** Consecutive stretches of skippable episodes, in order. */
function fillerRuns(info: ShowInfo): FillerRun[] {
  const runs: FillerRun[] = []
  const eps = [...info.episodes].sort((a, b) => a.number - b.number)
  let start = 0
  let prev = -1
  for (const ep of eps) {
    if (isFillerCategory(ep.category)) {
      // a gap in numbering also breaks a run
      if (start !== 0 && ep.number === prev + 1) {
        prev = ep.number
        continue
      }
      if (start !== 0) runs.push({ from: start, to: prev })
      start = ep.number
      prev = ep.number
    } else {
      if (start !== 0) runs.push({ from: start, to: prev })
      start = 0
      prev = -1
    }
  }
  if (start !== 0) runs.push({ from: start, to: prev })
  return runs
}

function rangeText(run: FillerRun): string {
  return run.from === run.to ? `${run.from}` : `${run.from}-${run.to}`
}

export async function fillerRunAnalysis(args: { slug?: string }): Promise<string> {
  const slug = (args.slug ?? "").trim()
  if (!slug) throw new ScrapeError("Provide the anime slug, e.g. 'naruto-shippuden'")
  const info = await getShow(slug)
  if (info.episodes.length === 0) {
    return `${info.title}: the site has no episode table to analyse yet.`
  }
  const runs = fillerRuns(info)
  const fillerCount = info.episodes.filter((e) => isFillerCategory(e.category)).length
  const pct = Math.round((fillerCount / info.episodes.length) * 100)
  const longest = runs.reduce<FillerRun | null>(
    (best, run) => (!best || run.to - run.from > best.to - best.from ? run : best),
    null
  )
  return [
    `${info.title} — ${info.episodes.length} episode(s) classified, ${fillerCount} skippable (${pct}%)`,
    longest
      ? `Longest filler run: ${longest.to - longest.from + 1} episode(s), eps ${rangeText(longest)}`
      : "Longest filler run: none, the site labels every classified episode canon.",
    runs.length > 0
      ? `Filler stretches: ${runs.map(rangeText).join(", ").slice(0, 200)}`
      : "",
  ]
    .filter(Boolean)
    .join("\n")
}

export async function fillerEpisodeList(args: { slug?: string; limit?: number }): Promise<string> {
  const slug = (args.slug ?? "").trim()
  if (!slug) throw new ScrapeError("Provide the anime slug, e.g. 'naruto-shippuden'")
  const limit = Math.max(1, Math.min(Math.round(args.limit ?? 40), 200))
  const info = await getShow(slug)
  if (info.episodes.length === 0) {
    return `${info.title}: the site has no episode table to list from yet.`
  }
  const filler = info.episodes
    .filter((e) => isFillerCategory(e.category))
    .sort((a, b) => a.number - b.number)
  if (filler.length === 0) {
    return `${info.title}: the site labels none of its ${info.episodes.length} tracked episodes as filler.`
  }
  const shown = filler.slice(0, limit)
  const body = shown
    .map((e, i) => `${i + 1}. ep${e.number} [${e.category}] ${e.title.slice(0, 70)}`)
    .join("\n")
  const more =
    filler.length > shown.length
      ? `\n...and ${filler.length - shown.length} more skippable episode(s).`
      : ""
  return `${info.title}: ${filler.length} skippable episode(s) of ${info.episodes.length} classified.\n${body}${more}`
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
