import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listMovies,
  getQueue,
  getHealth,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "radarr-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_movies",
    {
      title: "List movies",
      description: "Movies in the Radarr library, with status.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listMovies());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_queue",
    {
      title: "Download queue",
      description: "Active downloads and imports in the queue.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await getQueue());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_health",
    {
      title: "Health checks",
      description: "Radarr health warnings and errors.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await getHealth());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}