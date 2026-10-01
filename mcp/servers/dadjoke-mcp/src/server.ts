import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { DadJokeError, getJoke, randomJoke, searchJokes, typedJoke, chuckFact, comicStrip } from "./api.js"
import { premiumRequired } from "./license.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "dadjoke-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "random_joke",
    {
      title: "Random dad joke",
      description: "Get a random dad joke.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        return text((await randomJoke()).joke)
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "search_jokes",
    {
      title: "Search dad jokes",
      description: "Search dad jokes by keyword.",
      inputSchema: z.object({
        term: z.string().describe("Keyword, e.g. 'bicycle', 'dog', 'programmer'"),
        limit: z.number().int().min(1).max(30).default(5),
      }),
      annotations: READ_ONLY,
    },
    async ({ term, limit }) => {
      try {
        const results = await searchJokes(term, limit)
        if (results.length === 0) return text(`No dad jokes about "${term}".`)
        return text(results.map((j, i) => `${i + 1}. ${j.joke}`).join("\n\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "get_joke",
    {
      title: "Get joke by id",
      description: "Get one dad joke by its id.",
      inputSchema: z.object({
        id: z.string().describe("Joke id from search results"),
      }),
      annotations: READ_ONLY,
    },
    async ({ id }) => {
      try {
        return text((await getJoke(id)).joke)
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "typed_joke",
    {
      title: "Typed joke",
      description: "Get a two part joke from the JokeAPI in a category you choose: Programming, Pun, Dark, Spooky, Christmas, Misc or Any. Reports the content flags it sets.",
      inputSchema: z.object({
        category: z.string().describe("Category: Programming, Pun, Dark, Spooky, Christmas, Misc or Any. Defaults to Any.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: typed_joke ----
      const paywallMessage = await premiumRequired("typed_joke")
      if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
      // ---- paywall: end ----
      try {
        return text(await typedJoke(args))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "chuck_fact",
    {
      title: "Chuck fact",
      description: "Get a Chuck Norris fact, optionally from one category such as dev, food, science, money or travel.",
      inputSchema: z.object({
        category: z.string().describe("Category name, for example dev. Omit for any category.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: chuck_fact ----
      const paywallMessage = await premiumRequired("chuck_fact")
      if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
      // ---- paywall: end ----
      try {
        return text(await chuckFact(args))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "comic_strip",
    {
      title: "Comic strip",
      description: "Get an xkcd comic by number, or the latest one when no number is given, with its image link and alt text.",
      inputSchema: z.object({
        number: z.number().describe("Comic number, 1-4000. Omit for the latest.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: comic_strip ----
      const paywallMessage = await premiumRequired("comic_strip")
      if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
      // ---- paywall: end ----
      try {
        return text(await comicStrip(args))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof DadJokeError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
