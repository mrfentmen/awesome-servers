import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { prayerTimes } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })
const errorMessage = (e: unknown): string => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "aladhan-mcp", version: "1.0.0" })

  server.tool(
    "prayer_times",
    "Prayer times for a city today",
    { city: z.string().min(1).describe("City, e.g. London"), country: z.string().min(1).describe("Country, e.g. UK"), method: z.number().int().min(0).max(23).default(2).describe("Calculation method") },
    async ({ city, country, method }) => {
      try {
        return text(await prayerTimes(city, country, method))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
