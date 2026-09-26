import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  user,
  collections,
  raindrops,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "raindrop-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "user",
    {
      title: "User",
      description: "The Raindrop account the token belongs to.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await user());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "collections",
    {
      title: "Collections",
      description: "Bookmark collections with counts and ids.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await collections());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "raindrops",
    {
      title: "Bookmarks",
      description: "Bookmarks in one collection, with tags and links.",
      inputSchema: z.object({
        collection_id: z.string().describe("Collection ID (0 = all).")
      }),
      annotations: READ_ONLY,
    },
    async ({ collection_id }) => {
      try {
        return text(await raindrops(collection_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}