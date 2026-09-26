import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  publish,
  poll,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const MUTATING = { readOnlyHint: false, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "ntfy-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "publish",
    {
      title: "Publish",
      description: "Send a REAL notification to a topic.",
      inputSchema: z.object({
        topic: z.string().describe("Topic name."),
        message: z.string().describe("Message text.")
      }),
      annotations: MUTATING,
    },
    async ({ topic, message }) => {
      try {
        return text(await publish(topic, message));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "poll",
    {
      title: "Poll messages",
      description: "Cached messages as JSON.",
      inputSchema: z.object({
        topic: z.string().describe("Topic name.")
      }),
      annotations: READ_ONLY,
    },
    async ({ topic }) => {
      try {
        return text(await poll(topic));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}