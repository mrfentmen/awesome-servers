import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { formatAuthor, formatBook, formatWork, getAuthor, getEditions, getWork, OpenLibraryError, searchBooks } from "./api.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`
const key = z.string().min(1).describe("Open Library key such as /works/OL123W or OL123W")

export function createServer(): McpServer {
  const server = new McpServer({ name: "open-library-mcp", version: "1.0.0" })
  server.tool("search_books", "Search Open Library for books, authors, subjects, or ISBNs.", { query: z.string().min(1), limit: z.number().int().min(1).max(25).default(10) }, async ({ query, limit }) => {
    try { const result = await searchBooks(query, limit); return text(`Open Library found ${result.numFound ?? 0} result(s) for "${query}":\n\n${(result.docs ?? []).map((d, i) => formatBook(d, i)).join("\n\n")}`) } catch (e) { return text(error(e)) }
  })
  server.tool("get_work", "Get detailed metadata for an Open Library work.", { key }, async ({ key: workKey }) => { try { return text(formatWork(await getWork(workKey))) } catch (e) { return text(error(e)) } })
  server.tool("get_author", "Get metadata for an Open Library author.", { key }, async ({ key: authorKey }) => { try { return text(formatAuthor(await getAuthor(authorKey))) } catch (e) { return text(error(e)) } })
  server.tool("list_editions", "List editions of an Open Library work.", { key, limit: z.number().int().min(1).max(50).default(20) }, async ({ key: workKey, limit }) => { try { const result = await getEditions(workKey, limit); return text(`Editions for ${workKey}:\n\n${(result.docs ?? []).map((d, i) => formatBook(d, i)).join("\n\n")}`) } catch (e) { return text(error(e)) } })
  return server
}
export { OpenLibraryError }
