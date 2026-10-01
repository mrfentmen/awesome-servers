import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { random } from "./api.js"
import { search } from "./api.js"
import { summary, articleOutline, translations } from "./api.js"
import { premiumRequired } from "./license.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "wikipedia-mcp", version: "1.0.0" })
  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search Wikipedia for articles matching a query.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "summary",
    {
      title: "Summary",
      description: "Get the lead summary for a Wikipedia article.",
      inputSchema: z.object( { title: z.string().describe("Article title.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await summary(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "random",
    {
      title: "Random",
      description: "Get a random Wikipedia article summary.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await random(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "article_outline",
    {
      title: "Article outline",
      description: "The section outline of a Wikipedia article with its heading levels and section numbers, which is how you see an article's shape before reading it.",
      inputSchema: z.object( { title: z.string().describe("Article title, e.g. Ada Lovelace."), }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: article_outline ----
    const paywallMessage = await premiumRequired("article_outline")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await articleOutline(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "translations",
    {
      title: "Translations",
      description: "The other language editions of a Wikipedia article, from its interlanguage links, which the summary and search tools never show.",
      inputSchema: z.object( { title: z.string().describe("Article title."), limit: z.number().describe("Max languages.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: translations ----
    const paywallMessage = await premiumRequired("translations")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await translations(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
