import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { format, latestIndex, listCollections, searchCaptures } from "./api.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const errorText = (error: unknown) => text(`Error: ${error instanceof Error ? error.message : String(error)}`)

export function createServer() {
  const server = new McpServer({ name: "commoncrawl-mcp", version: "1.0.0" })
  server.tool("list_indexes", "List available Common Crawl web crawl index collections, newest first.", {}, async () => {
    try { return text(format((await listCollections()).slice(0, 30))) } catch (error) { return errorText(error) }
  })
  server.tool("latest_index", "Return the identifier of the newest Common Crawl index collection.", {}, async () => {
    try { return text(await latestIndex()) } catch (error) { return errorText(error) }
  })
  server.tool("search_captures", "Find historical Common Crawl captures matching a URL or wildcard pattern. This returns index metadata, not page contents.", {
    url: z.string().min(1).max(500).describe("URL or wildcard pattern, for example example.com/*"),
    index: z.string().regex(/^[A-Za-z0-9._-]+$/).optional().describe("Optional collection id such as CC-MAIN-2025-30"),
    page: z.number().int().min(1).max(20).default(1),
    limit: z.number().int().min(1).max(100).default(20),
  }, async ({ url, index, page, limit }) => {
    try { return text(format(await searchCaptures(url, index, page, limit))) } catch (error) { return errorText(error) }
  })
  return server
}
