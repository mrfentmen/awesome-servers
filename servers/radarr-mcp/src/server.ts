import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { errorMessage, listMovies, getQueue, getHealth, filmFacts, filmography } from "./api.js"
import { premiumRequired } from "./license.js"

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

  server.registerTool(
    "film_facts",
    {
      title: "Film facts",
      description:
        "The structured facts about a film from Wikidata: release date, runtime, director, cast, genre, studio, country, budget, box office and the IMDb and TMDB identifiers a library matches on.",
      inputSchema: z.object({
        title: z.string().describe("Film title, e.g. 'The Shawshank Redemption'"),
        year: z.string().describe("Release year, to disambiguate remakes.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: film_facts ----
    const paywallMessage = await premiumRequired("film_facts")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await filmFacts(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "filmography",
    {
      title: "Filmography",
      description:
        "A director's or actor's credits as Wikidata has them: every titled work with its year and IMDb identifier, ordered oldest first.",
      inputSchema: z.object({
        name: z.string().describe("Person or studio name, e.g. 'Christopher Nolan'"),
        limit: z.number().describe("Max titles, 1-50. Defaults to 15.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: filmography ----
    const paywallMessage = await premiumRequired("filmography")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await filmography(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  return server
}