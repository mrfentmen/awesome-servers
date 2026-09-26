import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  getMe,
  sendMessage,
  getUpdates,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const MUTATING = { readOnlyHint: false, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "telegram-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "get_me",
    {
      title: "Bot info",
      description: "Bot username and ID.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await getMe());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "send_message",
    {
      title: "Send message",
      description: "Send a REAL message to a chat.",
      inputSchema: z.object({
        chat_id: z.string().describe("Chat ID."),
        message: z.string().describe("Message text.")
      }),
      annotations: MUTATING,
    },
    async ({ chat_id, message }) => {
      try {
        return text(await sendMessage(chat_id, message));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_updates",
    {
      title: "Get updates",
      description: "Recent incoming updates.",
      inputSchema: z.object({
        limit: z.string().describe("Max results (default 10, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        return text(await getUpdates(limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}