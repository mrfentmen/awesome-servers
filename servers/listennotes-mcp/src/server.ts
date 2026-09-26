import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  search,
  bestPodcasts,
  getEpisode,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "listennotes-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search",
    {
      title: "Search episodes",
      description: "Episodes matching a query.",
      inputSchema: z.object({
        query: z.string().describe("Search text.")
      }),
      annotations: READ_ONLY,
    },
    async ({ query }) => {
      try {
        return text(await search(query));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "best_podcasts",
    {
      title: "Best podcasts",
      description: "Curated best lists.",
      inputSchema: z.object({
        page: z.string().describe("Page (default 1).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ page }) => {
      try {
        return text(await bestPodcasts(page));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_episode",
    {
      title: "Get episode",
      description: "Episode details.",
      inputSchema: z.object({
        episode_id: z.string().describe("Episode UUID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ episode_id }) => {
      try {
        return text(await getEpisode(episode_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}