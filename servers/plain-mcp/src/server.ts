import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listCustomers,
  listThreads,
  getThread,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "plain-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_customers",
    {
      title: "List customers",
      description: "Support customers.",
      inputSchema: z.object({
        limit: z.string().describe("Max results (default 10, max 50).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        return text(await listCustomers(limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_threads",
    {
      title: "List threads",
      description: "Support threads.",
      inputSchema: z.object({
        limit: z.string().describe("Max results (default 10, max 50).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        return text(await listThreads(limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_thread",
    {
      title: "Get thread",
      description: "Thread details by ID.",
      inputSchema: z.object({
        thread_id: z.string().describe("Thread ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ thread_id }) => {
      try {
        return text(await getThread(thread_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}