import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { randomJoke, categories } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })
const errorMessage = (e: unknown): string => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "chucknorris-mcp", version: "1.0.0" })

  server.tool(
    "random_joke",
    "Random Chuck Norris joke, optionally from one category",
    { category: z.string().default("").describe("Optional category, e.g. animal, career or food") },
    async ({ category }) => {
      try {
        return text(await randomJoke(category))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "categories",
    "All available joke categories",
    {  },
    async ({  }) => {
      try {
        return text(await categories())
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
