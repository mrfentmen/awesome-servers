import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { latestNav, navHistory, searchSchemes, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "mfapi-mcp", version: "1.0.0" })

  server.tool(
    "search_schemes",
    "Find mutual fund schemes by name, returning scheme codes.",
    {
      query: z.string().min(2).describe('Name fragment, e.g. "axis" or "hdfc mid cap"'),
      limit: z.number().int().min(1).max(30).default(10).describe("Schemes to return")
    },
    async (a) => {
      try {
        return text(await searchSchemes(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "latest_nav",
    "Latest published NAV plus scheme metadata for a scheme code.",
    {
      schemeCode: z.number().int().positive().describe("AMFI scheme code, e.g. 119551")
    },
    async (a) => {
      try {
        return text(await latestNav(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "nav_history",
    "Recent NAV history for a scheme, newest first.",
    {
      schemeCode: z.number().int().positive().describe("AMFI scheme code"),
      days: z.number().int().min(5).max(365).default(30).describe("How many NAV points to return")
    },
    async (a) => {
      try {
        return text(await navHistory(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  return server
}
