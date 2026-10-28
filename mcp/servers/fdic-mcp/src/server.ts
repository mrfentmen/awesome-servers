import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { banksInState, institutionDetail, searchInstitutions, SourceError, bankFinancials, banksByCity, bankLocations, failedBanks } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "fdic-mcp", version: "1.0.3" })

  server.tool(
    "search_institutions",
    "Find banks by name, optionally narrowed to a state.",
    {
      name: z.string().min(2).optional().describe("Name text to match, e.g. chase or first national"),
      state: z.string().length(2).optional().describe("Two-letter state code, e.g. NY"),
      limit: z.number().int().min(1).max(20).default(5).describe("Institutions to return")
    },
    async (a) => {
      try {
        return text(await searchInstitutions(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "institution_detail",
    "One bank by its FDIC certificate number.",
    {
      cert: z.number().int().min(1).describe("FDIC certificate number, e.g. 628")
    },
    async (a) => {
      try {
        return text(await institutionDetail(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "banks_in_state",
    "Active banks headquartered in a state, largest first.",
    {
      state: z.string().length(2).describe("Two-letter state code"),
      limit: z.number().int().min(1).max(25).default(10).describe("Banks to return")
    },
    async (a) => {
      try {
        return text(await banksInState(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

server.tool(
    "bank_financials",
    "Latest quarterly financials for one bank.",
    {
      cert: z.number().int().min(1).describe("FDIC certificate number, e.g. 628")
    },
    async (a) => {
      try {
        return text(await bankFinancials(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "banks_by_city",
    "Banks headquartered in a city.",
    {
      city: z.string().min(2).describe("City name, e.g. Chicago"),
      state: z.string().length(2).optional().describe("Two-letter state code"),
      limit: z.number().int().min(1).max(25).default(10).describe("Banks to return")
    },
    async (a) => {
      try {
        return text(await banksByCity(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "bank_locations",
    "Branch offices reported for one bank.",
    {
      cert: z.number().int().min(1).describe("FDIC certificate number"),
      limit: z.number().int().min(1).max(25).default(10).describe("Branches to return")
    },
    async (a) => {
      try {
        return text(await bankLocations(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "failed_banks",
    "Banks that have closed, newest records first.",
    {
      since: z.string().regex(/^\d{8}$/).optional().describe("Only closures on or after this YYYYMMDD date"),
      limit: z.number().int().min(1).max(25).default(10).describe("Banks to return")
    },
    async (a) => {
      try {
        return text(await failedBanks(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
