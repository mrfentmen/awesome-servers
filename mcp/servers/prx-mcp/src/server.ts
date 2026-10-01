import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { errorMessage, listPodcasts, getPodcast, listEpisodes, getEpisode } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "prx-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_podcasts",
    {
      title: "List podcasts",
      description: "PRX podcasts, paginated. No key needed.",
      inputSchema: z.object({
        page: z.string().describe("Page number.").optional(),
        per: z.string().describe("Items per page.").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ page, per }) => {
      try {
        return text(await listPodcasts(page, per));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_podcast",
    {
      title: "Get podcast",
      description: "Single PRX podcast by ID.",
      inputSchema: z.object({
        podcast_id: z.string().describe("Numeric podcast ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ podcast_id }) => {
      try {
        return text(await getPodcast(podcast_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_episodes",
    {
      title: "List episodes",
      description: "PRX episodes, paginated. No key needed.",
      inputSchema: z.object({
        page: z.string().describe("Page number.").optional(),
        per: z.string().describe("Items per page.").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ page, per }) => {
      try {
        return text(await listEpisodes(page, per));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_episode",
    {
      title: "Get episode",
      description: "Single PRX episode by UUID.",
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

  server.registerTool(
    "podcasts_by_genre",
    {
      title: "Podcasts by genre or tag",
      description: "Find PRX shows by subject: filter the catalogue by genre such as Science, or by a free tag such as astronomy.",
      inputSchema: z.object( { genre: z.string().describe("Genre, e.g. Science.").optional(), tag: z.string().describe("Tag, e.g. astronomy.").optional(), limit: z.number().describe("Max podcasts.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: podcasts_by_genre ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_prx_podcasts_by_genre", args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "recent_episodes",
    {
      title: "Recent episodes",
      description: "The newest episodes across the whole PRX catalogue, sorted by publication date, with runtime and podcast name.",
      inputSchema: z.object( { limit: z.number().describe("Max episodes.").optional(), explicit: z.boolean().describe("Only explicit (true) or only clean (false) episodes.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: recent_episodes ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_prx_recent_episodes", args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  return server
}