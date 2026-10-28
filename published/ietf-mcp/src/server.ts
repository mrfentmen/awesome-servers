import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { format, getDocument, listMeetings, searchDocuments, searchGroups } from "./api.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const errorText = (error: unknown) => text(`Error: ${error instanceof Error ? error.message : String(error)}`)

export function createServer() {
  const server = new McpServer({ name: "ietf-mcp", version: "1.0.0" })
  server.tool("search_documents", "Find IETF documents using the Datatracker name filter, with bounded pagination.", { query: z.string().min(1).max(120), limit: z.number().int().min(1).max(25).default(10), offset: z.number().int().min(0).max(1000).default(0) }, async ({ query, limit, offset }) => {
    try { return text(format(await searchDocuments(query, limit, offset))) } catch (error) { return errorText(error) }
  })
  server.tool("get_document", "Look up an IETF document by name, such as rfc9110 or draft-ietf-httpbis.", { name: z.string().min(1).max(120) }, async ({ name }) => {
    try { return text(format(await getDocument(name))) } catch (error) { return errorText(error) }
  })
  server.tool("search_working_groups", "Search IETF working groups by name.", { query: z.string().min(1).max(100), limit: z.number().int().min(1).max(25).default(10) }, async ({ query, limit }) => {
    try { return text(format(await searchGroups(query, limit))) } catch (error) { return errorText(error) }
  })
  server.tool("list_recent_meetings", "List recent IETF meetings from the public Datatracker.", { limit: z.number().int().min(1).max(25).default(10) }, async ({ limit }) => {
    try { return text(format(await listMeetings(limit))) } catch (error) { return errorText(error) }
  })
  return server
}
