import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listChannels,
  getChannel,
  getChannelUsers,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
export function createServer(): McpServer {
  const server = new McpServer({
    name: "pusher-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_channels",
    {
      title: "List channels",
      description: "Active channels with user counts.",
      inputSchema: z.object({
        prefix: z.string().describe("Name prefix filter.").optional(),
        limit: z.string().describe("Max results (default 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ prefix, limit }) => {
      try {
        return text(await listChannels(prefix, limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_channel",
    {
      title: "Channel details",
      description: "Occupancy details for a channel.",
      inputSchema: z.object({
        channel: z.string().describe("Channel name.")
      }),
      annotations: READ_ONLY,
    },
    async ({ channel }) => {
      try {
        return text(await getChannel(channel));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_channel_users",
    {
      title: "Channel users",
      description: "User IDs subscribed to a presence channel.",
      inputSchema: z.object({
        channel: z.string().describe("Presence channel name.")
      }),
      annotations: READ_ONLY,
    },
    async ({ channel }) => {
      try {
        return text(await getChannelUsers(channel));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}