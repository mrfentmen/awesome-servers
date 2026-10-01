import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  getTotals,
  getHits,
  getBreakdown,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const NON_READ_ONLY = { openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "goatcounter-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "get_totals",
    {
      title: "Get totals",
      description: "GoatCounter total pageviews for a date range.",
      inputSchema: z.object({
        start: z.string().optional().describe("Start datetime"),
        end: z.string().optional().describe("End datetime"),
      }),
      annotations: READ_ONLY,
    },
    async ({ start, end }) => {
      try {
        return text(await getTotals(start, end));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_hits",
    {
      title: "Get hits",
      description: "GoatCounter per-path pageviews with pagination.",
      inputSchema: z.object({
        limit: z.number().default(20).describe("How many paths"),
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        return text(await getHits(limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_breakdown",
    {
      title: "Get breakdown",
      description: "GoatCounter browser/system/location/language stats.",
      inputSchema: z.object({
        page: z.string().describe("One of browsers, systems, locations, languages, sizes, campaigns, toprefs"),
      }),
      annotations: READ_ONLY,
    },
    async ({ page }) => {
      try {
        return text(await getBreakdown(page));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}
