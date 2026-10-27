import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { format, summarize } from "./api.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const errorText = (error: unknown) => text(`Error: ${error instanceof Error ? error.message : String(error)}`)

export function createServer() {
  const server = new McpServer({ name: "police-transparency-mcp", version: "1.0.0" })
  server.tool("summarize_complaints", "Return aggregate historical NYPD complaint counts grouped by borough, broad law category, or offense description. No names, addresses, coordinates, demographics, incident rows, live dispatch, or person lookup are exposed.", {
    group: z.enum(["borough", "law_category", "offense"]),
    year: z.number().int().min(2006).max(2030).optional().describe("Historical complaint year; this is not real-time data."),
    borough: z.enum(["MANHATTAN", "BRONX", "BROOKLYN", "QUEENS", "STATEN ISLAND"]).optional(),
    limit: z.number().int().min(1).max(100).default(25),
  }, async ({ group, year, borough, limit }) => {
    try {
      return text(`DISCLAIMER: This is aggregated historical public data for research, not a live safety feed or individual lookup.\n\n${format(await summarize(group, year, borough, limit))}`)
    } catch (error) { return errorText(error) }
  })
  return server
}
