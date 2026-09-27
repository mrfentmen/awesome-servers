import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { autocompleteWorks, formatAuthor, formatNamed, formatWork, getAuthor, getWork, OpenAlexError, searchAuthors, searchFunders, searchInstitutions, searchPublishers, searchSources, searchTopics, searchWorks } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`
export function createServer(): McpServer {
  const server = new McpServer({ name: "openalex-mcp", version: "1.0.0" })
  server.registerTool(
    "search_works",
    {
      title: "Search works",
      description: "Search scholarly works by title, topic, author, or keyword.",
      inputSchema: z.object( { query: z.string().min(1), limit: z.number().int().min(1).max(25).default(10) }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => { try { const r = await searchWorks(query, limit); return text(`OpenAlex found ${r.meta?.count ?? 0} work(s) for "${query}":\n\n${(r.results ?? []).map((w, i) => formatWork(w, i)).join("\n\n")}`) } catch (e) { return textError(error(e)) } }
  )
  server.registerTool(
    "get_work",
    {
      title: "Get work",
      description: "Get one OpenAlex work by OpenAlex ID or URL.",
      inputSchema: z.object( { id: z.string().min(1) }),
      annotations: READ_ONLY,
    },
    async ({ id }) => { try { return text(formatWork(await getWork(id))) } catch (e) { return textError(error(e)) } }
  )
  server.registerTool(
    "search_authors",
    {
      title: "Search authors",
      description: "Search OpenAlex authors and institutions.",
      inputSchema: z.object( { query: z.string().min(1), limit: z.number().int().min(1).max(25).default(10) }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => { try { const r = await searchAuthors(query, limit); return text(`OpenAlex authors for "${query}":\n\n${(r.results ?? []).map((a, i) => formatAuthor(a, i)).join("\n\n")}`) } catch (e) { return textError(error(e)) } }
  )
  server.registerTool(
    "get_author",
    {
      title: "Get author",
      description: "Get one OpenAlex author by ID or URL.",
      inputSchema: z.object( { id: z.string().min(1) }),
      annotations: READ_ONLY,
    },
    async ({ id }) => { try { return text(formatAuthor(await getAuthor(id))) } catch (e) { return textError(error(e)) } }
  )
  server.registerTool(
    "search_sources",
    {
      title: "Search sources",
      description: "Search journals, conferences and repositories.",
      inputSchema: z.object( { query: z.string().min(1), limit: z.number().int().min(1).max(25).default(10) }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => { try { const r = await searchSources(query, limit); return text(`OpenAlex sources for "${query}":\n\n${(r.results ?? []).map((s, i) => formatNamed(s, i)).join("\n\n")}`) } catch (e) { return textError(error(e)) } }
  )
  server.registerTool(
    "search_institutions",
    {
      title: "Search institutions",
      description: "Search universities and research organizations.",
      inputSchema: z.object( { query: z.string().min(1), limit: z.number().int().min(1).max(25).default(10) }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => { try { const r = await searchInstitutions(query, limit); return text(`OpenAlex institutions for "${query}":\n\n${(r.results ?? []).map((s, i) => formatNamed(s, i)).join("\n\n")}`) } catch (e) { return textError(error(e)) } }
  )
  server.registerTool(
    "search_topics",
    {
      title: "Search topics",
      description: "Search research topics.",
      inputSchema: z.object( { query: z.string().min(1), limit: z.number().int().min(1).max(25).default(10) }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => { try { const r = await searchTopics(query, limit); return text(`OpenAlex topics for "${query}":\n\n${(r.results ?? []).map((s, i) => formatNamed(s, i)).join("\n\n")}`) } catch (e) { return textError(error(e)) } }
  )
  server.registerTool(
    "search_publishers",
    {
      title: "Search publishers",
      description: "Search academic publishers.",
      inputSchema: z.object( { query: z.string().min(1), limit: z.number().int().min(1).max(25).default(10) }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => { try { const r = await searchPublishers(query, limit); return text(`OpenAlex publishers for "${query}":\n\n${(r.results ?? []).map((s, i) => formatNamed(s, i)).join("\n\n")}`) } catch (e) { return textError(error(e)) } }
  )
  server.registerTool(
    "search_funders",
    {
      title: "Search funders",
      description: "Search research funders.",
      inputSchema: z.object( { query: z.string().min(1), limit: z.number().int().min(1).max(25).default(10) }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => { try { const r = await searchFunders(query, limit); return text(`OpenAlex funders for "${query}":\n\n${(r.results ?? []).map((s, i) => formatNamed(s, i)).join("\n\n")}`) } catch (e) { return textError(error(e)) } }
  )
  server.registerTool(
    "autocomplete_works",
    {
      title: "Autocomplete works",
      description: "Fast title autocomplete with citation counts.",
      inputSchema: z.object( { query: z.string().min(1) }),
      annotations: READ_ONLY,
    },
    async ({ query }) => { try { const r = await autocompleteWorks(query); return text(`Matches for "${query}" (${r.meta?.count ?? 0} total):\n\n${(r.results ?? []).slice(0, 10).map((w, i) => `${i + 1}. ${w.display_name ?? "?"} (${w.cited_by_count ?? 0} cites)`).join("\n")}`) } catch (e) { return textError(error(e)) } }
  )
  return server
}
export { OpenAlexError }
