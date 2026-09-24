import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listPodcasts,
  listEpisodes,
  getEpisode,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "simplecast-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_podcasts",
    {
      title: "List podcasts",
      description: "All Simplecast podcasts with ids and titles.",
      inputSchema: z.object({
      }),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listPodcasts());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_episodes",
    {
      title: "List episodes",
      description: "Episodes of a Simplecast podcast with ids, titles, dates.",
      inputSchema: z.object({
        podcastId: z.string().describe("Podcast id"),
        limit: z.number().default(10).describe("How many"),
      }),
      annotations: READ_ONLY,
    },
    async ({ podcastId, limit }) => {
      try {
        return text(await listEpisodes(podcastId, limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_episode",
    {
      title: "Get episode",
      description: "One Simplecast episode with metadata and audio URL.",
      inputSchema: z.object({
        episodeId: z.string().describe("Episode id"),
      }),
      annotations: READ_ONLY,
    },
    async ({ episodeId }) => {
      try {
        return text(await getEpisode(episodeId));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}
