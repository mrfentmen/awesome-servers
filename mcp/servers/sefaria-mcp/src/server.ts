import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { getText, bookDigest } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "sefaria-mcp", version: "1.0.0" })
  server.registerTool(
    "text",
    {
      title: "Text",
      description: "Get a text section.",
      inputSchema: z.object( { ref: z.string().describe("Ref like Genesis.1.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await getText(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "book_digest",
    {
      title: "Book digest",
      description: "What Sefaria's index says about a book: description, categories, corpus, dating, authorship and alternate titles.",
      inputSchema: z.object( { book: z.string().describe("Book name, e.g. Genesis, Shabbat, Mishnah Avot.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await bookDigest(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "book_structure",
    {
      title: "Book structure",
      description: "The shape of a book on Sefaria: section names, how many sections at each level, and the alternate groupings such as parashiyot or chapters with their ref ranges.",
      inputSchema: z.object( { book: z.string().describe("Book name, e.g. Genesis, Shabbat."), limit: z.number().describe("Max spans per alternate grouping, 1-30.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: book_structure ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_sefaria_book_structure", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "topic_digest",
    {
      title: "Topic digest",
      description: "Sefaria's topic page for a slug: the description, how many passages link to it, its known names and its artwork credit.",
      inputSchema: z.object( { topic: z.string().describe("Topic slug, e.g. love, prayer, covenant.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: topic_digest ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_sefaria_topic_digest", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
