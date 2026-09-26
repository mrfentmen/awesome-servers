import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listInstitutions,
  listCategories,
  sandboxToken,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const MUTATING = { readOnlyHint: false, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "plaid-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_institutions",
    {
      title: "List institutions",
      description: "Sandbox banks.",
      inputSchema: z.object({
        count: z.string().describe("Max results (default 10, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ count }) => {
      try {
        return text(await listInstitutions(count));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_categories",
    {
      title: "List categories",
      description: "Transaction categories.",
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
    "sandbox_token",
    {
      title: "Sandbox token",
      description: "Create a test public token (sandbox only).",
      inputSchema: z.object({
        institution_id: z.string().describe("Institution ID (default ins_109508).").optional()
      }),
      annotations: MUTATING,
    },
    async ({ institution_id }) => {
      try {
        return text(await sandboxToken(institution_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}