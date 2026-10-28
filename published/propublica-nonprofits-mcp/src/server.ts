import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { search_organizations, search_by_state, organization, filings, financials, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "propublica-nonprofits-mcp", version: "1.0.0" })

  server.tool(
    "search_organizations",
    "Search US nonprofits by name",
    {
      query: z.string().min(2).describe("Organisation name"),
      state: z.string().length(2).optional().describe("Optional two-letter state code"),
      limit: z.number().int().min(1).max(25).default(10).describe("Maximum organisations")
    },
    async (a) => {
      try {
        return text(await search_organizations(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "search_by_state",
    "Nonprofits registered in a US state",
    {
      state: z.string().length(2).describe("Two-letter state code, e.g. NY"),
      limit: z.number().int().min(1).max(25).default(10).describe("Maximum organisations")
    },
    async (a) => {
      try {
        return text(await search_by_state(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "organization",
    "Full nonprofit record by EIN",
    {
      ein: z.string().regex(/^\d{9}$/).describe("Nine-digit EIN, e.g. 581771391")
    },
    async (a) => {
      try {
        return text(await organization(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "filings",
    "IRS filings for a nonprofit",
    {
      ein: z.string().regex(/^\d{9}$/).describe("Nine-digit EIN")
    },
    async (a) => {
      try {
        return text(await filings(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "financials",
    "Latest reported revenue, expenses and assets",
    {
      ein: z.string().regex(/^\d{9}$/).describe("Nine-digit EIN")
    },
    async (a) => {
      try {
        return text(await financials(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
