import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  getFeedEntries,
  markEntry,
  listEntryTags,
  subscribeFeed,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const MUTATING = { readOnlyHint: false, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "commafeed-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "get_feed_entries",
    {
      title: "Feed entries",
      description: "Entries of a subscribed feed.",
      inputSchema: z.object({
        feed_id: z.string().describe("Subscription ID."),
        read_type: z.string().describe("all or unread (default all).").optional(),
        limit: z.string().describe("Max items (default 20, max 1000).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ feed_id, read_type, limit }) => {
      try {
        return text(await getFeedEntries(feed_id, read_type, limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "mark_entry",
    {
      title: "Mark entry",
      description: "Mark a feed entry read/unread.",
      inputSchema: z.object({
        entry_id: z.string().describe("Entry ID."),
        read: z.string().describe("true or false.")
      }),
      annotations: MUTATING,
    },
    async ({ entry_id, read }) => {
      try {
        return text(await markEntry(entry_id, read));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_entry_tags",
    {
      title: "Entry tags",
      description: "User's entry tags.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listEntryTags());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "subscribe_feed",
    {
      title: "Subscribe",
      description: "Subscribe to a feed URL.",
      inputSchema: z.object({
        url: z.string().describe("Feed URL.")
      }),
      annotations: MUTATING,
    },
    async ({ url }) => {
      try {
        return text(await subscribeFeed(url));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}