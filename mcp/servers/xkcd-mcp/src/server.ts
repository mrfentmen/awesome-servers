import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { formatComic, getComic, latestComic, XkcdError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

export function createServer(): McpServer {
  const server = new McpServer({
    name: "xkcd-mcp",
    version: "1.0.0",
  })

  server.tool(
    "latest_comic",
    "Get the newest xkcd comic.",
    {},
    async () => {
      try {
        return text(formatComic(await latestComic()))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_comic",
    "Get an xkcd comic by number.",
    { num: z.number().int().min(1).describe("Comic number, e.g. 200") },
    async ({ num }) => {
      try {
        return text(formatComic(await getComic(num)))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof XkcdError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
