import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { errorMessage, getJoke, jokeById, jokeInfo, listCategories, listLanguages, searchJokes, jokesByType, jokeRange } from "./api.js"
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
        return textError(String(e))
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
        return textError(String(e))
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
        return textError(String(e))
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
        return textError(String(e))
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
        return textError(String(e))
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
        return textError(String(e))
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
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "jokes_by_type",
    {
      title: "Jokes by type",
      description: "Only one-liners or only setup-and-punchline jokes, from any safe-mode category.",
      inputSchema: z.object({
        type: z.enum(["single", "twopart"]).describe("single (one-liners) or twopart (setup and punchline)."),
        category: z.string().describe("Any category name, or omit for Any.").optional(),
        amount: z.number().describe("How many jokes, 1-10 (default 3).").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await jokesByType(args)) } catch (e) { return textError(String(e)) }
    }
  )

  server.registerTool(
    "joke_range",
    {
      title: "Joke range",
      description: "Fetch a batch of jokes by id range, for building lists or checking ids.",
      inputSchema: z.object({
        from: z.string().describe("First joke id, e.g. 1."),
        to: z.string().describe("Last joke id, e.g. 200."),
        category: z.string().describe("Any category name, or omit for Any.").optional(),
        amount: z.number().describe("How many jokes, 1-10 (default 3).").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await jokeRange(args)) } catch (e) { return textError(String(e)) }
    }
  )

  server.registerTool(
    "joke_length_profile",
    {
      title: "Joke length profile",
      description: "Measure how long the jokes actually are - characters, words, median and range - with the setup and delivery split, the languages returned and any flags the service set. Optional length filter and flag filter.",
      inputSchema: z.object({ count: z.number().int().min(1).max(30).default(12).describe("How many jokes to measure (default 12, max 30)."), type: z.string().describe("Type filter, e.g. twopart, chain, programming, dark. No filter by default.").optional(), flags: z.string().describe("Comma separated flags to request, e.g. explicit,sexist.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // TODO: implement profile locally (paywall removed)
      try { return textError("Not yet implemented: profile") } catch (e) { return textError(String(e)) }
    }
  )

  server.registerTool(
    "joke_type_coverage",
    {
      title: "Joke type coverage",
      description: "Which joke types actually have a joke waiting right now: sample each type in safe mode and report the hit rate and mean length, which the catalogue listing never shows.",
      inputSchema: z.object({ samples: z.number().int().min(2).max(30).default(8).describe("How many times to ask per type (default 8, max 30).") }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // TODO: implement coverage locally (paywall removed)
      try { return textError("Not yet implemented: coverage") } catch (e) { return textError(String(e)) }
    }
  )

  return server
}
