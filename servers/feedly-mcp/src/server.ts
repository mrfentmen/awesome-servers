import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  profile,
  subscriptions,
  streamContents,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "feedly-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "profile",
    {
      title: "Profile",
      description: "The Feedly account the token belongs to.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await profile());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "subscriptions",
    {
      title: "Subscriptions",
      description: "Feeds the account follows, with titles.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await subscriptions());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "stream_contents",
    {
      title: "Stream contents",
      description: "Recent entries in a stream, newest first.",
      inputSchema: z.object({
        stream_id: z.string().describe("Stream ID, e.g. feed/https://example.com/feed"),
        count: z.string().describe("Max results (default 10, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ stream_id, count }) => {
      try {
        return text(await streamContents(stream_id, count));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}