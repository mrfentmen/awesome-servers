import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  getJoke,
  listCategories,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "jokeapi-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "get_joke",
    {
      title: "Random joke",
      description: "Safe-mode joke, optionally by category.",
      inputSchema: z.object({
        category: z.string().describe("Any, Programming, Misc, Dark, Pun, Spooky, Christmas (default Any).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ category }) => {
      try {
        return text(await getJoke(category));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_categories",
    {
      title: "List categories",
      description: "Joke categories.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listCategories());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}