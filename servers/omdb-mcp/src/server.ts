import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  searchMovies,
  getMovie,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "omdb-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_movies",
    {
      title: "Search movies",
      description: "Title search (needs OMDB_API_KEY).",
      inputSchema: z.object({
        query: z.string().describe("Title text, e.g. Blade Runner."),
        page: z.string().describe("Page number.").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ query, page }) => {
      try {
        return text(await searchMovies(query, page));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_movie",
    {
      title: "Get movie",
      description: "Full details by IMDb ID or exact title.",
      inputSchema: z.object({
        id_or_title: z.string().describe("tt1234567 or exact title.")
      }),
      annotations: READ_ONLY,
    },
    async ({ id_or_title }) => {
      try {
        return text(await getMovie(id_or_title));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}