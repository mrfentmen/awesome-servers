import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { featured } from "./api.js"
import { mostread, onThisDay, pictureOfTheDay } from "./api.js"
import { premiumRequired } from "./license.js"

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
    const paywallMessage = await premiumRequired("on_this_day")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await onThisDay(args)) } catch (e) { return textError(error(e)) }
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
    const paywallMessage = await premiumRequired("picture_of_the_day")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await pictureOfTheDay(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
