import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  searchArrests,
  arrestDetails,
  historicSearch,
  topOffenses,
  precinctActivity,
  boroughStats,
  recentFelonies,
  recentMisdemeanors,
  offenseLookup,
  arrestMapData,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "nyc-arrests-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_arrests",
    {
      title: "Search arrests",
      description: "Arrests by date, borough, offense, demographics.",
      inputSchema: z.object({
        borough: z.string().describe("Manhattan/Brooklyn/Queens/Bronx/Staten or M/K/Q/B/S.").optional(),
        offense: z.string().describe("Keyword, e.g. assault.").optional(),
        from: z.string().describe("Start YYYY-MM-DD.").optional(),
        to: z.string().describe("End YYYY-MM-DD.").optional(),
        age: z.string().describe("Age group.").optional(),
        sex: z.string().describe("M/F.").optional(),
        limit: z.string().describe("Max (default 20, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ borough, offense, from, to, age, sex, limit }) => {
      try {
        return text(await searchArrests({ borough, offense, from, to, age, sex, limit }));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "arrest_details",
    {
      title: "Arrest details",
      description: "One record by arrest key.",
      inputSchema: z.object({
        arrest_key: z.string().describe("Arrest key.")
      }),
      annotations: READ_ONLY,
    },
    async ({ arrest_key }) => {
      try {
        return text(await arrestDetails(arrest_key));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "historic_search",
    {
      title: "Historic search",
      description: "2006-2023 archive, same filters.",
      inputSchema: z.object({
        borough: z.string().describe("Borough.").optional(),
        offense: z.string().describe("Keyword.").optional(),
        from: z.string().describe("Start YYYY-MM-DD.").optional(),
        to: z.string().describe("End YYYY-MM-DD.").optional(),
        age: z.string().describe("Age group.").optional(),
        sex: z.string().describe("M/F.").optional(),
        limit: z.string().describe("Max (default 20, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ borough, offense, from, to, age, sex, limit }) => {
      try {
        return text(await historicSearch({ borough, offense, from, to, age, sex, limit }));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "top_offenses",
    {
      title: "Top offenses",
      description: "Offense ranking.",
      inputSchema: z.object({
        borough: z.string().describe("Borough filter.").optional(),
        limit: z.string().describe("Max (default 10, max 25).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ borough, limit }) => {
      try {
        return text(await topOffenses(borough, limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "precinct_activity",
    {
      title: "Precinct activity",
      description: "Recent arrests in a precinct.",
      inputSchema: z.object({
        precinct: z.string().describe("Precinct number."),
        limit: z.string().describe("Max (default 20, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ precinct, limit }) => {
      try {
        return text(await precinctActivity(precinct, limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "borough_stats",
    {
      title: "Borough stats",
      description: "Felony/misd/violation split.",
      inputSchema: z.object({
        borough: z.string().describe("Borough.")
      }),
      annotations: READ_ONLY,
    },
    async ({ borough }) => {
      try {
        return text(await boroughStats(borough));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "recent_felonies",
    {
      title: "Recent felonies",
      description: "Latest felony arrests.",
      inputSchema: z.object({
        limit: z.string().describe("Max (default 20, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        return text(await recentFelonies(limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "recent_misdemeanors",
    {
      title: "Recent misdemeanors",
      description: "Latest misdemeanor arrests.",
      inputSchema: z.object({
        limit: z.string().describe("Max (default 20, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        return text(await recentMisdemeanors(limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "offense_lookup",
    {
      title: "Penal-code lookup",
      description: "Arrests by PD code.",
      inputSchema: z.object({
        pd_code: z.string().describe("e.g. 101."),
        limit: z.string().describe("Max (default 20, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ pd_code, limit }) => {
      try {
        return text(await offenseLookup(pd_code, limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "arrest_map_data",
    {
      title: "Map data",
      description: "Arrests in a lat/lon box.",
      inputSchema: z.object({
        lat_min: z.string().describe("South edge."),
        lat_max: z.string().describe("North edge."),
        lon_min: z.string().describe("West edge."),
        lon_max: z.string().describe("East edge."),
        limit: z.string().describe("Max (default 50, max 200).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ lat_min, lat_max, lon_min, lon_max, limit }) => {
      try {
        return text(await arrestMapData(lat_min, lat_max, lon_min, lon_max, limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}