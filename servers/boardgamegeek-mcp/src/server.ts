import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { BggError, formatDetails, formatSummary, forumThreads, geeklist, getGame, getUser, guildInfo, hotGames, searchGames, threadArticles, userCollection, userPlays } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "boardgamegeek-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_games",
    {
      title: "Search board games",
      description: "Search BoardGameGeek for board games and expansions by title.",
      inputSchema: z.object({
        query: z.string().describe("Game title to search, e.g. 'Catan'"),
        exact: z.boolean().default(false).describe("Match the title exactly"),
        limit: z.number().int().min(1).max(20).default(5),
      }),
      annotations: READ_ONLY,
    },
    async ({ query, exact, limit }) => {
      try {
        const results = await searchGames(query, exact, limit)
        if (results.length === 0) return text(`No BoardGameGeek games match "${query}".`)
        return text(`BoardGameGeek results for "${query}":\n\n${results.map((g, i) => formatSummary(g, i)).join("\n")}`)
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "get_game",
    {
      title: "Get game details",
      description: "Get full BoardGameGeek details for one game: description, players, play time, categories, mechanics, designers, ratings, rank.",
      inputSchema: z.object({
        id: z.string().describe("Numeric BGG id, e.g. '174430' (use search_games to find it)"),
      }),
      annotations: READ_ONLY,
    },
    async ({ id }) => {
      try {
        const g = await getGame(id)
        if (!g) return text(`No BoardGameGeek game with id ${id}.`)
        return text(formatDetails(g))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "hot_games",
    {
      title: "BGG Hotness chart",
      description: "List the current BoardGameGeek Hotness chart (most talked-about board games).",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(20).default(10),
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        const results = await hotGames(limit)
        if (results.length === 0) return text("No hot games right now.")
        return text(`BoardGameGeek Hotness:\n\n${results.map((g, i) => formatSummary(g, i)).join("\n")}`)
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "get_user",
    {
      title: "Get BGG user",
      description: "Public BGG profile. Needs BGG_API_TOKEN since 2025.",
      inputSchema: z.object({
        username: z.string().describe("BGG username"),
      }),
      annotations: READ_ONLY,
    },
    async ({ username }) => {
      try {
        const u = await getUser(username)
        if (!u) return text(`No BGG user ${username}.`)
        return text(`${u.username}${u.firstName ? ` (${u.firstName} ${u.lastName ?? ""})` : ""}${u.yearRegistered ? ` since ${u.yearRegistered}` : ""}`)
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "user_plays",
    {
      title: "User plays",
      description: "Recently logged plays. Needs BGG_API_TOKEN.",
      inputSchema: z.object({
        username: z.string().describe("BGG username"),
        limit: z.number().int().min(1).max(20).default(10),
      }),
      annotations: READ_ONLY,
    },
    async ({ username, limit }) => {
      try {
        const rows = await userPlays(username, limit)
        if (!rows.length) return text(`No logged plays for ${username}.`)
        return text(rows.map((r, i) => `${i + 1}. ${r}`).join("\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "user_collection",
    {
      title: "User collection",
      description: "Owned games in a collection. Needs BGG_API_TOKEN.",
      inputSchema: z.object({
        username: z.string().describe("BGG username"),
        limit: z.number().int().min(1).max(20).default(10),
      }),
      annotations: READ_ONLY,
    },
    async ({ username, limit }) => {
      try {
        const results = await userCollection(username, true, limit)
        if (results.length === 0) return text(`No owned games for ${username}.`)
        return text(results.map((g, i) => formatSummary(g, i)).join("\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "guild_info",
    {
      title: "Guild info",
      description: "Guild details and members. Needs BGG_API_TOKEN.",
      inputSchema: z.object({
        id: z.string().describe("Numeric guild id"),
      }),
      annotations: READ_ONLY,
    },
    async ({ id }) => {
      try {
        return text(await guildInfo(id))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "forum_threads",
    {
      title: "Forum threads",
      description: "Threads in a forum. Needs BGG_API_TOKEN.",
      inputSchema: z.object({
        id: z.string().describe("Numeric forum id"),
        limit: z.number().int().min(1).max(20).default(10),
      }),
      annotations: READ_ONLY,
    },
    async ({ id, limit }) => {
      try {
        const rows = await forumThreads(id, limit)
        if (!rows.length) return text(`No threads in forum ${id}.`)
        return text(rows.map((r, i) => `${i + 1}. ${r}`).join("\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "thread_articles",
    {
      title: "Thread articles",
      description: "Posts in a thread. Needs BGG_API_TOKEN.",
      inputSchema: z.object({
        id: z.string().describe("Numeric thread id"),
        limit: z.number().int().min(1).max(10).default(5),
      }),
      annotations: READ_ONLY,
    },
    async ({ id, limit }) => {
      try {
        const rows = await threadArticles(id, limit)
        if (!rows.length) return text(`No articles in thread ${id}.`)
        return text(rows.map((r, i) => `${i + 1}. ${r}`).join("\n\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "geeklist",
    {
      title: "Geeklist",
      description: "Items in a geeklist. Needs BGG_API_TOKEN.",
      inputSchema: z.object({
        id: z.string().describe("Numeric geeklist id"),
        limit: z.number().int().min(1).max(20).default(10),
      }),
      annotations: READ_ONLY,
    },
    async ({ id, limit }) => {
      try {
        const results = await geeklist(id, limit)
        if (results.length === 0) return text(`Empty geeklist ${id}.`)
        return text(results.map((g, i) => formatSummary(g, i)).join("\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof BggError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
