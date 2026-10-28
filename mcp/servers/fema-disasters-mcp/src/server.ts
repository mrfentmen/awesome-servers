import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { recent_disasters, disasters_by_state, disasters_by_type, disasters_by_year, disaster_detail, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "fema-disasters-mcp", version: "1.0.0" })

  server.tool(
    "recent_disasters",
    "Most recent US disaster declarations",
    {
      limit: z.number().int().min(1).max(50).default(10).describe("Maximum declarations")
    },
    async (a) => {
      try {
        return text(await recent_disasters(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "disasters_by_state",
    "Disaster declarations for a US state",
    {
      state: z.string().length(2).describe("Two-letter state code, e.g. CA"),
      limit: z.number().int().min(1).max(50).default(10).describe("Maximum declarations")
    },
    async (a) => {
      try {
        return text(await disasters_by_state(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "disasters_by_type",
    "Declarations filtered by declaration type (DR, EM or FM)",
    {
      type: z.enum(["DR", "EM", "FM"]).describe("DR = major disaster, EM = emergency, FM = fire management"),
      limit: z.number().int().min(1).max(50).default(10).describe("Maximum declarations")
    },
    async (a) => {
      try {
        return text(await disasters_by_type(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "disasters_by_year",
    "Declarations for a fiscal year",
    {
      year: z.number().int().min(1950).max(2100).describe("Fiscal year, e.g. 2024"),
      limit: z.number().int().min(1).max(50).default(10).describe("Maximum declarations")
    },
    async (a) => {
      try {
        return text(await disasters_by_year(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "disaster_detail",
    "Declarations for one disaster number",
    {
      number: z.number().int().min(1).describe("FEMA disaster number, e.g. 4806")
    },
    async (a) => {
      try {
        return text(await disaster_detail(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
