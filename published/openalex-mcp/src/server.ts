import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { formatAuthor, formatWork, getAuthor, getWork, OpenAlexError, searchAuthors, searchWorks } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`
export function createServer(): McpServer {
  const server = new McpServer({ name: "openalex-mcp", version: "1.0.0" })
  server.tool("search_works", "Search scholarly works by title, topic, author, or keyword.", { query: z.string().min(1), limit: z.number().int().min(1).max(25).default(10) }, async ({ query, limit }) => { try { const r = await searchWorks(query, limit); return text(`OpenAlex found ${r.meta?.count ?? 0} work(s) for "${query}":\n\n${(r.results ?? []).map((w, i) => formatWork(w, i)).join("\n\n")}`) } catch (e) { return text(error(e)) } })
  server.tool("get_work", "Get one OpenAlex work by OpenAlex ID or URL.", { id: z.string().min(1) }, async ({ id }) => { try { return text(formatWork(await getWork(id))) } catch (e) { return text(error(e)) } })
  server.tool("search_authors", "Search OpenAlex authors and institutions.", { query: z.string().min(1), limit: z.number().int().min(1).max(25).default(10) }, async ({ query, limit }) => { try { const r = await searchAuthors(query, limit); return text(`OpenAlex authors for "${query}":\n\n${(r.results ?? []).map((a, i) => formatAuthor(a, i)).join("\n\n")}`) } catch (e) { return text(error(e)) } })
  server.tool("get_author", "Get one OpenAlex author by ID or URL.", { id: z.string().min(1) }, async ({ id }) => { try { return text(formatAuthor(await getAuthor(id))) } catch (e) { return text(error(e)) } })
  return server
}
export { OpenAlexError }
