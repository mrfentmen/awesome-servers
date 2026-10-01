import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listTeams,
  searchCards,
  getCollection,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const MUTATING = { readOnlyHint: false, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "guru-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_teams",
    {
      title: "List teams",
      description: "Guru teams (also validates credentials).",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listTeams());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "search_cards",
    {
      title: "Search cards",
      description: "Card search with Guru Query Language.",
      inputSchema: z.object({
        query: z.string().describe("GQL query, e.g. 'verificationState: Trusted'."),
        max_results: z.string().describe("Max results (max 50).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ query, max_results }) => {
      try {
        return text(await searchCards(query, max_results));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_collection",
    {
      title: "Get collection",
      description: "Collection by UUID.",
      inputSchema: z.object({
        collection_id: z.string().describe("Collection UUID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ collection_id }) => {
      try {
        return text(await getCollection(collection_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}