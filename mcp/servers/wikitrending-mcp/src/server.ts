import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { featured, mostread, projectPageviews } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "wikitrending-mcp", version: "1.0.0" })
  server.registerTool(
    "featured",
    {
      title: "Featured",
      description: "Featured article for a date.",
      inputSchema: z.object( { date: z.string().describe("Date YYYY/MM/DD, defaults to today.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await featured(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "mostread",
    {
      title: "Mostread",
      description: "Most-read articles for a date.",
      inputSchema: z.object( { date: z.string().describe("Date YYYY/MM/DD, defaults to today.").optional(), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await mostread(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "on_this_day",
    {
      title: "On this day",
      description: "Notable things that happened on a date, from the same Wikipedia featured feed as featured and mostread.",
      inputSchema: z.object( { date: z.string().describe("Date as YYYY/MM/DD or YYYY-MM-DD; defaults to today.").optional(), limit: z.number().int().min(1).max(25).default(10).describe("Max entries.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: on_this_day ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_wikitrending_on_this_day", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "picture_of_the_day",
    {
      title: "Picture of the day",
      description: "Wikipedia's picture of the day for a date, with its description, artist, licence and image link.",
      inputSchema: z.object( { date: z.string().describe("Date as YYYY/MM/DD or YYYY-MM-DD; defaults to today.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: picture_of_the_day ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_wikitrending_picture_of_the_day", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "article_pageviews",
    {
      title: "Article pageviews",
      description: "Daily readership of an English Wikipedia article over a date range.",
      inputSchema: z.object( { title: z.string().describe("Exact article title."), start: z.string().describe("First date, YYYY-MM-DD."), end: z.string().describe("Last date, YYYY-MM-DD; at most 31 days inclusive.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: article_pageviews ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_wikitrending_article_pageviews", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "project_pageviews",
    {
      title: "Project pageviews",
      description: "Daily total readership of English Wikipedia over a date range.",
      inputSchema: z.object( { start: z.string().describe("First date, YYYY-MM-DD."), end: z.string().describe("Last date, YYYY-MM-DD; at most 31 days inclusive.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await projectPageviews(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
