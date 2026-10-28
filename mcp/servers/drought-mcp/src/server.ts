import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { compareStates, stateDrought, SourceError, countyDrought, nationalSummary, droughtTrend } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "drought-mcp", version: "1.0.2" })

  server.tool(
    "state_drought",
    "Drought severity shares for one state over a date range.",
    {
      stateFips: z.number().int().min(1).max(78).describe("State FIPS code, e.g. 48 for Texas"),
      start: z.string().describe("Start date MM/DD/YYYY"),
      end: z.string().describe("End date MM/DD/YYYY"),
      weekly: z.boolean().default(false).describe("true for weekly average statistics instead of cumulative")
    },
    async (a) => {
      try {
        return text(await stateDrought(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "compare_states",
    "Latest drought shares for several states side by side.",
    {
      stateFips: z.array(z.number().int().min(1).max(78)).min(2).max(8).describe("Two to eight state FIPS codes"),
      date: z.string().describe("Week to report, MM/DD/YYYY")
    },
    async (a) => {
      try {
        return text(await compareStates(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

server.tool(
    "county_drought",
    "Drought shares for one US county.",
    {
      countyFips: z.string().regex(/^\d{5}$/).describe("Five-digit county FIPS, e.g. 06001"),
      date: z.string().describe("Week date, MM/DD/YYYY")
    },
    async (a) => {
      try {
        return text(await countyDrought(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "national_summary",
    "National drought area shares for one week.",
    {
      date: z.string().describe("Week date, MM/DD/YYYY")
    },
    async (a) => {
      try {
        return text(await nationalSummary(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "drought_trend",
    "Weekly drought trend for a state.",
    {
      stateFips: z.number().int().min(1).max(78).describe("State FIPS code, e.g. 6 for California"),
      weeks: z.number().int().min(2).max(52).default(8).describe("Weeks of history")
    },
    async (a) => {
      try {
        return text(await droughtTrend(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
