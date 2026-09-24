import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  getShow,
  listShowEpisodes,
  getEpisode,
  searchShows,
  createShow,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const MUTATING = { readOnlyHint: false, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "spreaker-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "get_show",
    {
      title: "Get show",
      description: "Retrieve a single Spreaker show by numeric ID.",
      inputSchema: z.object({
        show_id: z.string().describe("Numeric Spreaker show ID."),
      }),
      annotations: READ_ONLY,
    },
    async ({ show_id }) => {
      try {
        return text(await getShow(show_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_show_episodes",
    {
      title: "List show episodes",
      description: "List episodes of a Spreaker show.",
      inputSchema: z.object({
        show_id: z.string().describe("Numeric Spreaker show ID."),
        limit: z.string().describe("Max items (default 50, max 100).").optional(),
      }),
      annotations: READ_ONLY,
    },
    async ({ show_id, limit }) => {
      try {
        return text(await listShowEpisodes(show_id, limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_episode",
    {
      title: "Get episode",
      description: "Retrieve a single Spreaker episode by numeric ID.",
      inputSchema: z.object({
        episode_id: z.string().describe("Numeric Spreaker episode ID."),
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
    "search_shows",
    {
      title: "Search shows",
      description: "Search public Spreaker shows. No API key required.",
      inputSchema: z.object({
        query: z.string().describe("Search query."),
        limit: z.string().describe("Max items.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => {
      try {
        return text(await searchShows(query, limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "create_show",
    {
      title: "Create show",
      description: "Create a new Spreaker show (requires SPREAKER_ACCESS_TOKEN).",
      inputSchema: z.object({
        title: z.string().describe("Show title (5-40 chars)."),
        language: z.string().describe("ISO 639-1 language code, e.g. en."),
      }),
      annotations: MUTATING,
    },
    async ({ title, language }) => {
      try {
        return text(await createShow(title, language));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}