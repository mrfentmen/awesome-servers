import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { formatShow, imdbOf, searchShows, TraktError, trendingMovies, trendingShows, match_title, dedupe_entries, show_identifiers } from "./api.js"
import { premiumRequired } from "./license.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "trakt-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_shows",
    {
      title: "Search shows",
      description: "TV shows by title with years and IMDb links.",
      inputSchema: z.object({
        query: z.string().describe("Show title, e.g. 'Severance'"),
        limit: z.number().int().min(1).max(50).default(5),
      }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => {
      try {
        const rows = await searchShows(query, limit)
        if (rows.length === 0) return text(`No shows for "${query}".`)
        return text(rows.map((s, i) => formatShow(s, imdbOf(s.ids), i)).join("\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "trending_shows",
    {
      title: "Trending shows",
      description: "Shows trending on Trakt right now.",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(100).default(5),
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        const rows = await trendingShows(limit)
        if (rows.length === 0) return text("Nothing trending.")
        return text(rows.map((s, i) => formatShow(s, imdbOf(s.ids), i)).join("\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "trending_movies",
    {
      title: "Trending movies",
      description: "Movies trending on Trakt right now.",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(100).default(5),
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        const rows = await trendingMovies(limit)
        if (rows.length === 0) return text("Nothing trending.")
        return text(rows.map((s, i) => formatShow(s, imdbOf(s.ids), i)).join("\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "match_title",
    {
      title: "Match a title",
      description: "Given the title you want and a list of candidate records from searchShows, rank them by how well they match, scoring shared content words at seventy percent and the year at thirty, and say plainly which record to use. A title alone is ambiguous across remakes and reboots, and the existing tools return a list with no way to choose between two shows of the same name.",
      inputSchema: z.object({
        query: z.string().describe("The title you are looking for. A year in the query is used to break ties."),
        candidates: z.array(z.object({}).passthrough()).describe("The show or movie records to choose between, as searchShows returns them: title, year and ids."),
        limit: z.number().int().min(1).max(25).optional().describe("How many candidates to show. Default 8."),
      }),
      annotations: READ_ONLY,
    },
    async ({ query, candidates, limit }) => {
      // ---- paywall: match_title ----
      const paywallMessage = await premiumRequired("match_title")
      if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
      // ---- paywall: end ----
      try { return text(match_title({ query, candidates, limit })) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "dedupe_entries",
    {
      title: "Deduplicate records",
      description: "Find and merge duplicate records in a list of shows or movies. Two records are the same thing if they share any trakt, slug, imdb, tmdb or tvdb identifier, and only failing that if their normalised title and year agree, so two shows of the same name from different years are never merged. Reports what each duplicate carries and which record is the safer one to keep. A search result routinely returns the same show twice under different slugs.",
      inputSchema: z.object({
        entries: z.array(z.object({}).passthrough()).describe("The show or movie records to check, each with title, year and ids."),
      }),
      annotations: READ_ONLY,
    },
    async ({ entries }) => {
      // ---- paywall: dedupe_entries ----
      const paywallMessage = await premiumRequired("dedupe_entries")
      if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
      // ---- paywall: end ----
      try { return text(dedupe_entries({ entries })) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "show_identifiers",
    {
      title: "Show identifiers",
      description: "Expand one show or movie record into every identifier it carries and a usable link for each, covering imdb, tmdb and tvdb as well as the trakt slug, and name the ones that are absent along with what a record missing them cannot be used for. The existing tools print the imdb link only, and print nothing at all when the imdb id is missing.",
      inputSchema: z.object({
        entry: z.object({}).passthrough().describe("One show or movie record with title, year and ids."),
      }),
      annotations: READ_ONLY,
    },
    async ({ entry }) => {
      try { return text(show_identifiers({ entry })) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof TraktError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
