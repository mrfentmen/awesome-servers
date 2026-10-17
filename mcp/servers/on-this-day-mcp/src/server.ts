import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { births, deaths, events } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "on-this-day-mcp", version: "1.0.0" })
  server.registerTool(
    "events",
    {
      title: "Events",
      description: "Historic events on a date.",
      inputSchema: z.object( { month: z.number().describe("Month 1 to 12."), day: z.number().describe("Day 1 to 31."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await events(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "births",
    {
      title: "Births",
      description: "Famous births on a date.",
      inputSchema: z.object( { month: z.number().describe("Month 1 to 12."), day: z.number().describe("Day 1 to 31."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await births(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "deaths",
    {
      title: "Deaths",
      description: "Famous deaths on a date.",
      inputSchema: z.object( { month: z.number().describe("Month 1 to 12."), day: z.number().describe("Day 1 to 31."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await deaths(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "holidays",
    {
      title: "Holidays",
      description: "Holidays and observances on a date, from the Wikipedia On This Day feed.",
      inputSchema: z.object( { month: z.number().describe("Month 1 to 12."), day: z.number().describe("Day 1 to 31."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement holidays locally (paywall removed)
    try { return textError("Not yet implemented: holidays") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "selected",
    {
      title: "Selected",
      description: "Wikipedia's editor-selected notable entries for a date, from the On This Day feed.",
      inputSchema: z.object( { month: z.number().describe("Month 1 to 12."), day: z.number().describe("Day 1 to 31."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement selected locally (paywall removed)
    try { return textError("Not yet implemented: selected") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
