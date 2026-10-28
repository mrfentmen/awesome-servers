import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { breachDetail, latestBreach, listBreaches, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "haveibeenpwned-mcp", version: "1.0.1" })

  server.tool(
    "list_breaches",
    "Every breach in the catalogue, newest first, optionally one domain.",
    {
      domain: z.string().min(3).optional().describe("Limit to one domain, e.g. adobe.com"),
      limit: z.number().int().min(1).max(50).default(10).describe("Breaches to return")
    },
    async (a) => {
      try {
        return text(await listBreaches(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "breach_detail",
    "One breach by its account name, with data classes and counts.",
    {
      name: z.string().min(2).describe("Breach name as HIBP stores it, e.g. Adobe or LinkedIn")
    },
    async (a) => {
      try {
        return text(await breachDetail(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "latest_breach",
    "The most recently added breach in the catalogue.",
    {
      // no arguments
    },
    async (a) => {
      try {
        return text(await latestBreach())
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
