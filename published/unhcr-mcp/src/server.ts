import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { asylumByCountry, populationByOrigin, trends, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "unhcr-mcp", version: "1.0.1" })

  server.tool(
    "population_by_origin",
    "Displacement figures for one country of origin in a year.",
    {
      year: z.number().int().min(1951).max(2100).describe("Year, e.g. 2023"),
      origin: z.string().length(3).describe("Country of origin ISO3 code, e.g. AFG or SYR"),
      limit: z.number().int().min(1).max(25).default(10).describe("Rows to return")
    },
    async (a) => {
      try {
        return text(await populationByOrigin(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "asylum_by_country",
    "Displacement figures for one country of asylum in a year.",
    {
      year: z.number().int().min(1951).max(2100).describe("Year, e.g. 2023"),
      asylum: z.string().length(3).describe("Country of asylum ISO3 code, e.g. DEU or TUR"),
      limit: z.number().int().min(1).max(25).default(10).describe("Rows to return")
    },
    async (a) => {
      try {
        return text(await asylumByCountry(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "trends",
    "Year-by-year displacement totals for a country of origin.",
    {
      origin: z.string().length(3).describe("Country of origin ISO3 code"),
      yearFrom: z.number().int().min(1951).max(2100).describe("First year"),
      yearTo: z.number().int().min(1951).max(2100).describe("Last year")
    },
    async (a) => {
      try {
        return text(await trends(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
