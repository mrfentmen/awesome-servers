import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  sendMessage,
  listMessages,
  listApps,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const MUTATING = { readOnlyHint: false, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "gotify-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "send_message",
    {
      title: "Send message",
      description: "Push a notification via Gotify.",
      inputSchema: z.object({
        title: z.string().describe("Message title."),
        message: z.string().describe("Message body."),
        priority: z.string().describe("0-10 (default 5).").optional()
      }),
      annotations: MUTATING,
    },
    async ({ title, message, priority }) => {
      try {
        return text(await sendMessage(title, message, priority));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_messages",
    {
      title: "List messages",
      description: "Messages stored on the Gotify server, newest first.",
      inputSchema: z.object({
        limit: z.string().describe("Max results (default 20, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        return text(await listMessages(limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_apps",
    {
      title: "List applications",
      description: "Registered Gotify applications.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listApps());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}