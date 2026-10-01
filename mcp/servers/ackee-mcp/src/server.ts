import { premiumTool } from "./gateway.js"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { errorMessage, listDomains, getDomain, getTopBrowsers } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "ackee-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_domains",
    {
      title: "List domains",
      description: "All Ackee domains with ids and titles.",
      inputSchema: z.object({
      }),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listDomains());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_domain",
    {
      title: "Get domain facts",
      description: "Ackee domain facts: active visitors plus yearly unique views.",
      inputSchema: z.object({
        domainId: z.string().describe("Domain id"),
      }),
      annotations: READ_ONLY,
    },
    async ({ domainId }) => {
      try {
        return text(await getDomain(domainId));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_top_browsers",
    {
      title: "Get top browsers",
      description: "Top browsers on an Ackee domain over the last 6 months.",
      inputSchema: z.object({
        domainId: z.string().describe("Domain id"),
      }),
      annotations: READ_ONLY,
    },
    async ({ domainId }) => {
      try {
        return text(await getTopBrowsers(domainId));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "app_store_search",
    {
      title: "Search iOS apps",
      description: "Search the public iTunes App Store by keyword: name, developer, genre, price, average rating, rating count and latest version date.",
      inputSchema: z.object({
        query: z.string().describe("App name or keyword, e.g. 'weather', 'pomodoro'"),
        country: z.string().default("us").describe("Two-letter store country, e.g. us, gb, jp"),
        limit: z.number().int().min(1).max(20).default(5),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: app_store_search ----
      // The body runs on the gateway, behind the licence gate.
      // ---- paywall: end ----
      try {
        return text(await premiumTool("mcp_ackee_app_store_search", args));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "app_store_reviews",
    {
      title: "Read App Store reviews",
      description: "Most recent customer reviews for one iOS app from the public App Store review feed: star rating, app version, date, author and review text.",
      inputSchema: z.object({
        appId: z.string().describe("Numeric App Store app id from app_store_search, e.g. 553834731"),
        page: z.number().int().min(1).max(10).default(1).describe("Review feed page, 1-10"),
        limit: z.number().int().min(1).max(20).default(10),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: app_store_reviews ----
      // The body runs on the gateway, behind the licence gate.
      // ---- paywall: end ----
      try {
        return text(await premiumTool("mcp_ackee_app_store_reviews", args));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}
