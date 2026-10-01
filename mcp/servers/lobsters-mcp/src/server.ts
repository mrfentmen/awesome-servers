import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { newest, top, story } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "lobsters-mcp", version: "1.0.0" })
  server.registerTool(
    "newest",
    {
      title: "Newest",
      description: "Newest stories on Lobsters.",
      inputSchema: z.object( { limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await newest(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "top",
    {
      title: "Top",
      description: "Top stories on Lobsters.",
      inputSchema: z.object( { limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await top(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "tag_stories",
    {
      title: "Tag stories",
      description: "Recent Lobsters stories carrying a given tag, with score, comment count, submitter and link.",
      inputSchema: z.object( { tag: z.string().describe("Tag name, e.g. 'rust'."), limit: z.number().describe("Max stories.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: tag_stories ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_lobsters_tag_stories", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "story",
    {
      title: "Story",
      description: "One Lobsters story in full: title, link, discussion url, submitter, score, flags, tags, description and its comment tree.",
      inputSchema: z.object( { id: z.string().describe("Story id, e.g. 'hq6xj2'."), commentLimit: z.number().describe("Max comments.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await story(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
