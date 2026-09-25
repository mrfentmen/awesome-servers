import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listChecks,
  getCheck,
  listResults,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "checkly-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_checks",
    {
      title: "List checks",
      description: "API and browser checks.",
      inputSchema: z.object({
        limit: z.string().describe("Max results (default 20, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        return text(await listChecks(limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_check",
    {
      title: "Get check",
      description: "Check config by ID.",
      inputSchema: z.object({
        check_id: z.string().describe("Check ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ check_id }) => {
      try {
        return text(await getCheck(check_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_results",
    {
      title: "List results",
      description: "Recent results for a check.",
      inputSchema: z.object({
        check_id: z.string().describe("Check ID."),
        limit: z.string().describe("Max results (default 10, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ check_id, limit }) => {
      try {
        return text(await listResults(check_id, limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}