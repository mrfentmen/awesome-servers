import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  getCard,
  selectCards,
  simpleCreateCard,
  checkAuth,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const MUTATING = { readOnlyHint: false, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "supernotes-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "get_card",
    {
      title: "Get card",
      description: "SuperNotes card by UUID.",
      inputSchema: z.object({
        card_id: z.string().describe("Card UUID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ card_id }) => {
      try {
        return text(await getCard(card_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "select_cards",
    {
      title: "Search cards",
      description: "Search/select cards with optional query and limit.",
      inputSchema: z.object({
        search: z.string().describe("Search text.").optional(),
        limit: z.string().describe("Max cards.").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ search, limit }) => {
      try {
        return text(await selectCards(search, limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "simple_create_card",
    {
      title: "Create card",
      description: "Create a card with name/markup.",
      inputSchema: z.object({
        name: z.string().describe("Card title.").optional(),
        markup: z.string().describe("Card markdown content.").optional()
      }),
      annotations: MUTATING,
    },
    async ({ name, markup }) => {
      try {
        return text(await simpleCreateCard(name, markup));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "check_auth",
    {
      title: "Check auth",
      description: "Validate the API key, returns user ID.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await checkAuth());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}