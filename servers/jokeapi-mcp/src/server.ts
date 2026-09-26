import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  getJoke,
  jokeById,
  jokeInfo,
  listCategories,
  listLanguages,
  searchJokes,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

const CATEGORY = z
  .string()
  .describe("Category such as Programming, Pun, Misc, Spooky, Christmas (default Any)")
  .optional()

export function createServer(): McpServer {
  const server = new McpServer({
    name: "jokeapi-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "get_joke",
    {
      title: "Get a joke",
      description:
        "One safe-mode joke, or several at once, optionally from a category like Programming or Pun.",
      inputSchema: z.object({
        category: CATEGORY,
        amount: z.number().int().min(1).max(10).default(1).describe("How many jokes to return"),
      }),
      annotations: READ_ONLY,
    },
    async ({ category, amount }) => {
      try {
        return text(await getJoke(category, amount))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "search_jokes",
    {
      title: "Search jokes",
      description: "Find jokes that contain a word or phrase, e.g. 'chicken' or 'programmer'.",
      inputSchema: z.object({
        contains: z.string().describe("Word or phrase the joke must contain"),
        category: CATEGORY,
        amount: z.number().int().min(1).max(10).default(3).describe("How many jokes to return"),
      }),
      annotations: READ_ONLY,
    },
    async ({ contains, category, amount }) => {
      try {
        return text(await searchJokes(contains, category, amount))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "joke_by_id",
    {
      title: "Joke by id",
      description: "Fetch one specific joke by its numeric id, so you can reuse the same joke.",
      inputSchema: z.object({
        id: z.string().describe("Numeric joke id, e.g. '1'"),
        category: CATEGORY,
      }),
      annotations: READ_ONLY,
    },
    async ({ id, category }) => {
      try {
        return text(await jokeById(id, category))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "list_categories",
    {
      title: "List categories",
      description: "All safe-mode joke categories.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        return text(await listCategories())
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "joke_info",
    {
      title: "Joke database info",
      description: "How many jokes exist and how they break down by category.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        return text(await jokeInfo())
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "list_languages",
    {
      title: "List languages",
      description: "Languages the joke database is translated into.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        return text(await listLanguages())
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "random_programming_joke",
    {
      title: "Programming joke",
      description: "A quick programming joke - handy when you just want something to say to a developer.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        return text(await getJoke("Programming", 1))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  return server
}
