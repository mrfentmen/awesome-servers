import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { communities, recentPosts, instanceInfo } from "./api.js"
import { premiumRequired } from "./license.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "lemmy-mcp", version: "1.0.0" })
  server.registerTool(
    "communities",
    {
      title: "Communities",
      description: "Public communities on an instance.",
      inputSchema: z.object( { limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await communities(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "recent_posts",
    {
      title: "Recent posts",
      description: "The most active posts on lemmy.world across every community, with score, comment count, author and permalink.",
      inputSchema: z.object( { limit: z.number().describe("Max posts.").optional(), sort: z.string().describe("Active, Hot, New, TopAll, TopDay, TopWeek, TopMonth, TopYear, MostComments or NewComments.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: recent_posts ----
    const paywallMessage = await premiumRequired("recent_posts")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await recentPosts(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "instance_info",
    {
      title: "Instance info",
      description: "What the lemmy.world instance is: name, software version, publish date, user and content counts, and its sidebar rules.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
    // ---- paywall: instance_info ----
    const paywallMessage = await premiumRequired("instance_info")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try {
      return text(await instanceInfo());
    } catch (e) {
      return textError(error(e));
    }
    }
  );

  return server
}
