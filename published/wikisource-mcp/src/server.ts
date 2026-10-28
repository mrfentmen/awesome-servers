import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { extract, format, searchTitles } from "./api.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const errorText = (error: unknown) => text(`Error: ${error instanceof Error ? error.message : String(error)}`)

export function createServer() {
  const server = new McpServer({ name: "wikisource-mcp", version: "1.0.0" })
  server.tool("search_texts", "Search Wikisource titles and snippets for texts and primary sources hosted on the project.", { query: z.string().min(1).max(200), limit: z.number().int().min(1).max(25).default(10) }, async ({ query, limit }) => {
    try { return text(format(await searchTitles(query, limit))) } catch (error) { return errorText(error) }
  })
  server.tool("read_text", "Read a bounded plain-text extract from a Wikisource page. Verify the page's rights and edition before reuse.", { title: z.string().min(1).max(300), introOnly: z.boolean().default(true), maxCharacters: z.number().int().min(200).max(12000).default(4000) }, async ({ title, introOnly, maxCharacters }) => {
    try { return text(format(await extract(title, introOnly, maxCharacters))) } catch (error) { return errorText(error) }
  })
  return server
}
