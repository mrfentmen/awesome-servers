import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listChannels,
  getHistory,
  postMessage,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const MUTATING = { readOnlyHint: false, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "slack-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_channels",
    {
      title: "List channels",
      description: "Public channels in the workspace, with id and name.",
      inputSchema: z.object({
        limit: z.string().describe("Max results (default 20, max 200).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        return text(await listChannels(limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_history",
    {
      title: "Channel history",
      description: "Recent messages in one channel, newest last.",
      inputSchema: z.object({
        channel: z.string().describe("Channel ID, e.g. C0123456789"),
        limit: z.string().describe("Max results (default 10, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ channel, limit }) => {
      try {
        return text(await getHistory(channel, limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "post_message",
    {
      title: "Post message",
      description: "Post a message to a channel as the bot, visible to everyone.",
      inputSchema: z.object({
        channel: z.string().describe("Channel ID, e.g. C0123456789"),
        message: z.string().describe("Message text.")
      }),
      annotations: MUTATING,
    },
    async ({ channel, message }) => {
      try {
        return text(await postMessage(channel, message));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}