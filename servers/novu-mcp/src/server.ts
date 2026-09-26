import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listSubscribers,
  getSubscriber,
  listTopics,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "novu-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_subscribers",
    {
      title: "Subscribers",
      description: "Notification subscribers, with email and id.",
      inputSchema: z.object({
        limit: z.string().describe("Max results (default 10, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        return text(await listSubscribers(limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_subscriber",
    {
      title: "Get subscriber",
      description: "One subscriber by id, with channels and data.",
      inputSchema: z.object({
        subscriber_id: z.string().describe("Subscriber ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ subscriber_id }) => {
      try {
        return text(await getSubscriber(subscriber_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_topics",
    {
      title: "Topics",
      description: "Notification topics with subscriber counts.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listTopics());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}