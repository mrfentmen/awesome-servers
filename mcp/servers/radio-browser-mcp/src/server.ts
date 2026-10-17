import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { RadioError, formatStation, searchStations, stationsByCountry, stationsByTag, topVoted } from "./api.js"
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "radio-browser-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_stations",
    {
      title: "Search stations",
      description: "Search 40,000+ internet radio stations by name.",
      inputSchema: z.object(
    { name: z.string().describe("Station name, e.g. 'hardcore' or 'SomaFM'"), limit: z.number().int().min(1).max(20).default(8) }),
      annotations: READ_ONLY,
    },
    async ({ name, limit }) => {
      try {
        const stations = await searchStations(name, limit)
        if (stations.length === 0) return text(`No stations match "${name}".`)
        return text(`Stations matching "${name}":\n\n${stations.map((s, i) => formatStation(s, i)).join("\n\n")}`)
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "stations_by_tag",
    {
      title: "Stations by tag",
      description: "Find stations by genre tag (e.g. 'hardcore', 'jazz', 'lofi', 'pirate').",
      inputSchema: z.object(
    { tag: z.string().describe("Genre tag"), limit: z.number().int().min(1).max(20).default(8) }),
      annotations: READ_ONLY,
    },
    async ({ tag, limit }) => {
      try {
        const stations = await stationsByTag(tag, limit)
        if (stations.length === 0) return text(`No stations tagged "${tag}".`)
        return text(`Top "${tag}" stations:\n\n${stations.map((s, i) => formatStation(s, i)).join("\n\n")}`)
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "stations_by_country",
    {
      title: "Stations by country",
      description: "Find stations from a country (e.g. 'Japan', 'Germany', 'Netherlands').",
      inputSchema: z.object(
    { country: z.string().describe("Country name"), limit: z.number().int().min(1).max(20).default(8) }),
      annotations: READ_ONLY,
    },
    async ({ country, limit }) => {
      try {
        const stations = await stationsByCountry(country, limit)
        if (stations.length === 0) return text(`No stations in "${country}".`)
        return text(`Top stations in ${country}:\n\n${stations.map((s, i) => formatStation(s, i)).join("\n\n")}`)
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "get_top_voted",
    {
      title: "Get top voted",
      description: "The most-voted stations on the whole network — a good 'what's live right now' pulse.",
      inputSchema: z.object(
    { limit: z.number().int().min(1).max(25).default(10) }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        const stations = await topVoted(limit)
        return text(`Most-voted stations:\n\n${stations.map((s, i) => formatStation(s, i)).join("\n\n")}`)
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "list_tags",
    {
      title: "List tags",
      description: "The genre and mood tags Radio Browser stations carry, with a station count for each, so you can pick a tag to browse.",
      inputSchema: z.object({
        prefix: z.string().describe("Only show tags containing this text.").optional(),
        limit: z.number().describe("Max tags, 1-200, default 30.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement tags locally (paywall removed)
    try { return textError("Not yet implemented: tags") } catch (e) { return textError(String(e)) }
    }
  )

  server.registerTool(
    "list_countries",
    {
      title: "List countries",
      description: "The countries Radio Browser covers, with ISO 3166-1 codes and station counts, so you can find the code to browse by country.",
      inputSchema: z.object({
        prefix: z.string().describe("Filter by country name or ISO code.").optional(),
        limit: z.number().describe("Max countries, 1-200, default 30.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement countries locally (paywall removed)
    try { return textError("Not yet implemented: countries") } catch (e) { return textError(String(e)) }
    }
  )

  server.registerTool(
    "stations_by_language",
    {
      title: "Stations by language",
      description: "Radio stations that broadcast in a given language, ordered by how often they are played.",
      inputSchema: z.object({
        language: z.string().describe("Language name or code, e.g. 'english' or 'german'."),
        limit: z.number().describe("Max stations, 1-25, default 8.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement language locally (paywall removed)
    try { return textError("Not yet implemented: language") } catch (e) { return textError(String(e)) }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof RadioError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
