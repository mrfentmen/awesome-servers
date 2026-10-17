import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { street } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "ukpolice-mcp", version: "1.0.0" })
  server.registerTool(
    "street",
    {
      title: "Street",
      description: "Street-level crimes near coordinates.",
      inputSchema: z.object( { lat: z.number().describe("Latitude."), lng: z.number().describe("Longitude."), date: z.string().describe("Month YYYY-MM.").optional(), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await street(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "police_forces",
    {
      title: "Police forces",
      description: "Every police force in England, Wales and Scotland with its data.police.uk api id, which the street crime tool never lists.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement forces locally (paywall removed)
    try { return textError("Not yet implemented: forces") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "force_crime_summary",
    {
      title: "Force crime summary",
      description: "Street crime from data.police.uk aggregated by offence category, which shows the shape of crime rather than raw incidents.",
      inputSchema: z.object( { force: z.string().describe("Force id, e.g. metropolitan-police.").optional(), month: z.string().describe("Month as YYYY-MM.").optional(), limit: z.number().describe("Max categories.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement summary locally (paywall removed)
    try { return textError("Not yet implemented: summary") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
