import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { formatSeries, FredError, geoData, releaseTables, releasesList, searchSeries, seriesInfo, seriesObservations, seriesVintages, sourcesList, tagList } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "fred-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_series",
    {
      title: "Search series",
      description: "Search FRED economic series (GDP, unemployment, CPI...) by keyword.",
      inputSchema: z.object({
        query: z.string().describe("Search text, e.g. 'unemployment rate'"),
        limit: z.number().int().min(1).max(100).default(5),
      }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => {
      try {
        const rows = await searchSeries(query, limit)
        if (rows.length === 0) return text(`No FRED series for "${query}".`)
        return text(rows.map((s, i) => formatSeries(s, i)).join("\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "series_observations",
    {
      title: "Series observations",
      description: "Latest values of a FRED series, newest first.",
      inputSchema: z.object({
        id: z.string().describe("Series id, e.g. 'UNRATE' (use search_series)"),
        limit: z.number().int().min(1).max(100).default(12),
      }),
      annotations: READ_ONLY,
    },
    async ({ id, limit }) => {
      try {
        return text(await seriesObservations(id, limit))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "series_info",
    {
      title: "Series info",
      description: "Metadata, range and notes for one FRED series.",
      inputSchema: z.object({
        id: z.string().describe("Series id, e.g. 'UNRATE'"),
      }),
      annotations: READ_ONLY,
    },
    async ({ id }) => {
      try {
        return text(await seriesInfo(id))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "series_vintages",
    {
      title: "Series vintages",
      description: "ALFRED vintage (revision) dates for a series.",
      inputSchema: z.object({
        id: z.string().describe("Series id, e.g. 'UNRATE'"),
        limit: z.number().int().min(1).max(100).default(5),
      }),
      annotations: READ_ONLY,
    },
    async ({ id, limit }) => {
      try {
        return text(await seriesVintages(id, limit))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "release_tables",
    {
      title: "Release tables",
      description: "Data tables of a FRED release.",
      inputSchema: z.object({
        release_id: z.string().describe("Release id, e.g. '53'"),
      }),
      annotations: READ_ONLY,
    },
    async ({ release_id }) => {
      try {
        return text(await releaseTables(release_id))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "tag_list",
    {
      title: "Tag list",
      description: "Browse FRED tags.",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(100).default(20),
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        return text(await tagList(limit))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "geo_data",
    {
      title: "Regional data",
      description: "GeoFRED state/county values for a series.",
      inputSchema: z.object({
        id: z.string().describe("Series id, e.g. 'UNRATE'"),
        date: z.string().describe("Date like '2024-01-01'.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async ({ id, date }) => {
      try {
        return text(await geoData(id, date))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "releases_list",
    {
      title: "Releases list",
      description: "Browse FRED data releases.",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(100).default(10),
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        return text(await releasesList(limit))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "sources_list",
    {
      title: "Sources list",
      description: "Browse FRED data sources.",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(100).default(10),
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        return text(await sourcesList(limit))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof FredError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
