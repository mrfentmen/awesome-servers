import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listCategories,
  getCount,
  getQuestions,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "opentdb-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_categories",
    {
      title: "List categories",
      description: "Trivia categories.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listCategories());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_count",
    {
      title: "Question count",
      description: "Counts for a category.",
      inputSchema: z.object({
        category: z.string().describe("Category ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ category }) => {
      try {
        return text(await getCount(category));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_questions",
    {
      title: "Get questions",
      description: "Quiz questions.",
      inputSchema: z.object({
        amount: z.string().describe("Count (default 5, max 20).").optional(),
        category: z.string().describe("Category ID.").optional(),
        difficulty: z.string().describe("easy, medium or hard.").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ amount, category, difficulty }) => {
      try {
        return text(await getQuestions(amount, category, difficulty));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}