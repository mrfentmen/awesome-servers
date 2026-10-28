import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { character, emojiSearch, format, searchBlocks } from "./api.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const errorText = (error: unknown) => text(`Error: ${error instanceof Error ? error.message : String(error)}`)

export function createServer() {
  const server = new McpServer({ name: "unicode-mcp", version: "1.0.0" })
  server.tool("get_character", "Get official UnicodeData metadata for a code point such as U+1F600 or 0041.", { codePoint: z.string().min(1).max(12) }, async ({ codePoint }) => {
    try { const result = await character(codePoint); return text(result ? format(result) : `No UnicodeData entry found for ${codePoint}.`) } catch (error) { return errorText(error) }
  })
  server.tool("search_blocks", "Search official Unicode block names and ranges.", { query: z.string().min(1).max(100) }, async ({ query }) => {
    try { return text(format(await searchBlocks(query))) } catch (error) { return errorText(error) }
  })
  server.tool("search_emoji", "Search the official Unicode emoji test data by annotation or emoji name.", { query: z.string().min(1).max(100) }, async ({ query }) => {
    try { return text(format(await emojiSearch(query))) } catch (error) { return errorText(error) }
  })
  return server
}
