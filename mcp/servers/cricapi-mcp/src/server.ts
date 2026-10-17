import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { CricApiError, currentMatches, formatMatch, matchInfo, searchSeries, seriesFixtures, seriesStandings } from "./api.js"
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "cricapi-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "current_matches",
    {
      title: "Current matches",
      description: "Live and recent cricket matches with scores and venues.",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(20).default(5),
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        const rows = await currentMatches(limit)
        if (rows.length === 0) return text("No current matches.")
        return text(rows.map((m, i) => formatMatch(m, i)).join("\n\n"))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "match_info",
    {
      title: "Match info",
      description: "One match: status, score, venue.",
      inputSchema: z.object({
        id: z.string().describe("Match id (use current_matches)"),
      }),
      annotations: READ_ONLY,
    },
    async ({ id }) => {
      try {
        return text(formatMatch(await matchInfo(id)))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "search_series",
    {
      title: "Search series",
      description: "Cricket series and tournaments by name.",
      inputSchema: z.object({
        query: z.string().describe("Search text, e.g. 'Ashes', 'IPL'"),
        limit: z.number().int().min(1).max(20).default(5),
      }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => {
      try {
        const rows = await searchSeries(query, limit)
        if (rows.length === 0) return text(`No series for "${query}".`)
        return text(rows.map((s, i) => `${i + 1}. ${s}`).join("\n"))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "series_fixtures",
    {
      title: "Series fixtures",
      description: "Fixtures and results for a cricket competition from ESPNcricinfo's public feed: date, teams, scores, result state and the match link. Takes an ESPNcricinfo series id, or a competition name to look one up.",
      inputSchema: z.object({
        series: z.string().optional().describe("Series id, e.g. 8048, or a competition name such as 'The Ashes'"),
        year: z.number().int().optional().describe("Season year, e.g. 2026"),
        limit: z.number().int().min(1).max(200).default(20),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await seriesFixtures(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "series_standings",
    {
      title: "Series standings",
      description: "The points table for a cricket competition from ESPNcricinfo's public feed, one line per team with the stats that feed publishes.",
      inputSchema: z.object({
        series: z.string().optional().describe("Series id, e.g. 8048, or a competition name"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await seriesStandings(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "match_scorecard",
    {
      title: "Match scorecard",
      description: "The full scorecard of one cricket match from ESPNcricinfo: the score by innings, boundaries, the leading scorers and wicket-takers for each side, the result note and the officials.",
      inputSchema: z.object({
        series: z.string().optional().describe("Series id, e.g. 8048, or a competition name"),
        event_id: z.string().describe("Match id from the match link, e.g. 1535465"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement scorecard locally (paywall removed)
    try { return textError("Not yet implemented: scorecard") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof CricApiError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
