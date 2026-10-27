import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  search,
  bestPodcasts,
  getEpisode,
  justListen,
  getPodcast,
  podcastRecommendations,
  listGenres,
  trendingSearches,
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
      description: "Podcast episodes matching a query, with podcast and date.",
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
      description: "Curated best-podcast lists, e.g. tech.",
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
      description: "One episode by id, with audio URL and description.",
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
    "just_listen",
    {
      title: "Random episode",
      description: "Serendipity listen.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await justListen());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_podcast",
    {
      title: "Get podcast",
      description: "Show details.",
      inputSchema: z.object({
        podcast_id: z.string().describe("Podcast UUID.")
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
    "podcast_recommendations",
    {
      title: "Similar shows",
      description: "Recommended podcasts.",
      inputSchema: z.object({
        podcast_id: z.string().describe("Podcast UUID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ podcast_id }) => {
      try {
        return text(await podcastRecommendations(podcast_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_genres",
    {
      title: "Podcast genres",
      description: "Genre list.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listGenres());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "trending_searches",
    {
      title: "Trending searches",
      description: "Trending queries.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await trendingSearches());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}