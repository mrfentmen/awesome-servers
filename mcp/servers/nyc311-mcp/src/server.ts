import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { countRequests, format, searchRequests } from "./api.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const errorText = (error: unknown) => text(`Error: ${error instanceof Error ? error.message : String(error)}`)
const date = z.string().regex(/^\\d{4}-\\d{2}-\\d{2}/).optional()

export function createServer() {
  const server = new McpServer({ name: "nyc311-mcp", version: "1.0.0" })
  const filters = {
    complaintType: z.string().max(120).optional(),
    borough: z.enum(["MANHATTAN", "BRONX", "BROOKLYN", "QUEENS", "STATEN ISLAND"]).optional(),
    agency: z.string().max(20).optional(),
    start: date,
    end: date,
  }
  server.tool("search_requests", "Search recent public NYC 311 requests using non-location-identifying fields. Addresses and coordinates are intentionally excluded.", {
    ...filters,
    limit: z.number().int().min(1).max(50).default(20),
  }, async ({ complaintType, borough, agency, start, end, limit }) => {
    try { return text(format(await searchRequests(complaintType, borough, agency, start, end, limit))) } catch (error) { return errorText(error) }
  })
  server.tool("count_requests", "Count NYC 311 requests grouped by complaint type with optional date, borough, and agency filters.", {
    ...filters,
    limit: z.number().int().min(1).max(100).default(50),
  }, async ({ complaintType, borough, agency, start, end, limit }) => {
    try { return text(format(await countRequests(complaintType, borough, agency, start, end, limit))) } catch (error) { return errorText(error) }
  })
  return server
}
