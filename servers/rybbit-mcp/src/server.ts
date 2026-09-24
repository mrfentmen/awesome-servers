import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  getOverview,
  listUsers,
  getJourneys,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "rybbit-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "get_overview",
    {
      title: "Get site overview",
      description: "Rybbit sessions, pageviews, users, bounce rate for a site and period.",
      inputSchema: z.object({
        site: z.string().describe("Site id"),
        startDate: z.string().describe("Start YYYY-MM-DD"),
        endDate: z.string().describe("End YYYY-MM-DD"),
        timeZone: z.string().default("UTC").describe("IANA timezone"),
      }),
      annotations: READ_ONLY,
    },
    async ({ site, startDate, endDate, timeZone }) => {
      try {
        return text(await getOverview(site, startDate, endDate, timeZone));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_users",
    {
      title: "List users",
      description: "Rybbit users for a site with pagination.",
      inputSchema: z.object({
        site: z.string().describe("Site id"),
        startDate: z.string().describe("Start"),
        endDate: z.string().describe("End"),
        timeZone: z.string().default("UTC").describe("Timezone"),
        limit: z.number().default(20).describe("How many"),
      }),
      annotations: READ_ONLY,
    },
    async ({ site, startDate, endDate, timeZone, limit }) => {
      try {
        return text(await listUsers(site, startDate, endDate, timeZone, limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_journeys",
    {
      title: "Get journeys",
      description: "Common Rybbit navigation paths (journeys) through a site.",
      inputSchema: z.object({
        site: z.string().describe("Site id"),
        startDate: z.string().describe("Start"),
        endDate: z.string().describe("End"),
        timeZone: z.string().default("UTC").describe("Timezone"),
      }),
      annotations: READ_ONLY,
    },
    async ({ site, startDate, endDate, timeZone }) => {
      try {
        return text(await getJourneys(site, startDate, endDate, timeZone));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}
