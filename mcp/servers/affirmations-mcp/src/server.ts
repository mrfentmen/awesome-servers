import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { many, random, randomAdvice, adviceById } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "affirmations-mcp", version: "1.0.0" })
  server.registerTool(
    "random",
    {
      title: "Random",
      description: "One random affirmation.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await random(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "many",
    {
      title: "Many",
      description: "Several affirmations.",
      inputSchema: z.object( { count: z.number().describe("How many.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await many(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "quote_of_the_day",
    {
      title: "Quote of the day",
      description: "Today's ZenQuotes quote with its date and attributed author, the same one for everyone on a given day.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement day locally (paywall removed)
    try { return textError("Not yet implemented: day") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "random_advice",
    {
      title: "Random advice slip",
      description: "One advice slip from Advice Slip, with the slip id so the same one can be read again by id.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await randomAdvice(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "advice_by_id",
    {
      title: "Advice slip by id",
      description: "One specific advice slip from Advice Slip, fetched by its numeric id.",
      inputSchema: z.object( { id: z.number().describe("Advice slip id, a positive whole number.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await adviceById(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "advice_search",
    {
      title: "Search advice slips",
      description: "Advice slips mentioning a word, with the slip id and the date each slip was published.",
      inputSchema: z.object( { term: z.string().describe("Word to look for, e.g. life."), limit: z.number().describe("Max slips to show, 1-25.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement search locally (paywall removed)
    try { return textError("Not yet implemented: search") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
