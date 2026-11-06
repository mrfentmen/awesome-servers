import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { NagerError, countries, holidays, next } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

const errorMessage = (e: unknown): string => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "nager-date-mcp", version: "1.0.0" })

  server.tool(
    "countries",
    "List the countries that have public holiday data, with their two-letter codes.",
    {},
    async () => {
      try {
        return text(await countries())
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "holidays",
    "Public holidays for one country in one year, with local names and whether each is nationwide or regional.",
    {
      country: z.string().length(2).describe('Two-letter country code, e.g. "US", "FR", "DE"'),
      year: z.number().int().min(1900).max(2200).default(new Date().getFullYear()).describe("Year to list"),
    },
    async ({ country, year }) => {
      try {
        return text(await holidays(country, year))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "next",
    "The upcoming public holidays for a country, starting from today.",
    { country: z.string().length(2).describe('Two-letter country code, e.g. "US", "FR", "DE"') },
    async ({ country }) => {
      try {
        return text(await next(country))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
