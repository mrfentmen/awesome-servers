import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listCountries,
  getHolidays,
  nextHolidays,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "nager-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_countries",
    {
      title: "List countries",
      description: "Supported country codes.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listCountries());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_holidays",
    {
      title: "Year holidays",
      description: "Holidays for a year and country.",
      inputSchema: z.object({
        year: z.string().describe("Year, e.g. 2026."),
        country: z.string().describe("ISO code, e.g. US.")
      }),
      annotations: READ_ONLY,
    },
    async ({ year, country }) => {
      try {
        return text(await getHolidays(year, country));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "next_holidays",
    {
      title: "Upcoming holidays",
      description: "Next holidays for a country.",
      inputSchema: z.object({
        country: z.string().describe("ISO code, e.g. US.")
      }),
      annotations: READ_ONLY,
    },
    async ({ country }) => {
      try {
        return text(await nextHolidays(country));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}