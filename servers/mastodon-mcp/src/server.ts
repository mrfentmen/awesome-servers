import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  trendingTags,
  trendingPosts,
  instanceInfo,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "mastodon-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "trending_tags",
    {
      title: "Trending tags",
      description: "Hashtags trending on the instance right now.",
      inputSchema: z.object({
        limit: z.string().describe("Max results (default 10, max 20).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        return text(await trendingTags(limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "trending_posts",
    {
      title: "Trending posts",
      description: "Statuses trending on the instance right now.",
      inputSchema: z.object({
        limit: z.string().describe("Max results (default 10, max 20).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        return text(await trendingPosts(limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "instance_info",
    {
      title: "Instance info",
      description: "Instance description, version and user counts.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await instanceInfo());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}