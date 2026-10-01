import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

import { m0_formatAuthor, m0_formatBook, m0_formatWork, m0_getAuthor, m0_getEditions, m0_getWork, m0_OpenLibraryError, m0_searchBooks, m1_lookup, m1_validate } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: 'text' as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`
const errorMessage = error

const m0_key = z.string().min(1).describe("Open Library key such as /works/OL123W or OL123W")

export function createServer(): McpServer {
  const server = new McpServer({ name: 'open-library-mcp', version: '1.0.0' })
server.registerTool(
    "search_books",
    {
      title: "Search books",
      description: "Search Open Library for books, authors, subjects, or ISBNs.",
      inputSchema: z.object( { query: z.string().min(1), limit: z.number().int().min(1).max(25).default(10) }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => {
    try { const result = await m0_searchBooks(query, limit); return text(`Open Library found ${result.numFound ?? 0} result(s) for "${query}":\n\n${(result.docs ?? []).map((d, i) => m0_formatBook(d, i)).join("\n\n")}`) } catch (e) { return textError(error(e)) }
  }
  )
server.registerTool(
    "get_work",
    {
      title: "Get work",
      description: "Get detailed metadata for an Open Library work.",
      inputSchema: z.object( { m0_key }),
      annotations: READ_ONLY,
    },
    async ({ m0_key: workKey }) => { try { return text(m0_formatWork(await m0_getWork(workKey))) } catch (e) { return textError(error(e)) } }
  )
server.registerTool(
    "get_author",
    {
      title: "Get author",
      description: "Get metadata for an Open Library author.",
      inputSchema: z.object( { m0_key }),
      annotations: READ_ONLY,
    },
    async ({ m0_key: authorKey }) => { try { return text(m0_formatAuthor(await m0_getAuthor(authorKey))) } catch (e) { return textError(error(e)) } }
  )
server.registerTool(
    "list_editions",
    {
      title: "List editions",
      description: "List editions of an Open Library work.",
      inputSchema: z.object( { m0_key, limit: z.number().int().min(1).max(50).default(20) }),
      annotations: READ_ONLY,
    },
    async ({ m0_key: workKey, limit }) => { try { const result = await m0_getEditions(workKey, limit); return text(`Editions for ${workKey}:\n\n${(result.docs ?? []).map((d, i) => m0_formatBook(d, i)).join("\n\n")}`) } catch (e) { return textError(error(e)) } }
  )
server.registerTool(
    "validate",
    {
      title: "Validate",
      description: "Check an ISBN 10 or ISBN 13 checksum.",
      inputSchema: z.object( { isbn: z.string().describe("The ISBN to check.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m1_validate(args)) } catch (e) { return textError(error(e)) }
  }
  )
server.registerTool(
    "lookup",
    {
      title: "Lookup",
      description: "Look up a book by ISBN.",
      inputSchema: z.object( { isbn: z.string().describe("The ISBN to look up.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m1_lookup(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "author_works",
    {
      title: "Author works",
      description: "Every work an author has in Open Library, with publication dates and cover links - the author record itself only carries a work count.",
      inputSchema: z.object( { author: z.string().describe("Open Library author key, e.g. OL45804A."), limit: z.number().describe("Max works.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: author_works ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_open_library_author_works", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "subject_works",
    {
      title: "Subject works",
      description: "Browse an Open Library subject shelf such as science_fiction, listing the works and how many the subject holds in total.",
      inputSchema: z.object( { subject: z.string().describe("Subject key, e.g. science_fiction."), limit: z.number().describe("Max works.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: subject_works ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_open_library_subject_works", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
