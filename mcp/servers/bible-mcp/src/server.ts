import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

import { verse, search, kjvChapter, bibleBooks } from "./api.js"
const text = (value: string) => ({ content: [{ type: 'text' as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: 'bible-mcp', version: '1.0.0' })
  server.registerTool(
    'verse',
    {
      title: "Verse",
      description: 'Read Bible verses by reference from bible-api.com.',
      inputSchema: z.object( { reference: z.string().describe('Reference like John 3:16.').optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await verse(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    'search',
    {
      title: "Search",
      description: 'Search Bible text for a phrase.',
      inputSchema: z.object( { query: z.string().describe('Search phrase.').optional(), limit: z.number().describe('Max results.').optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    'kjvChapter',
    {
      title: "Kjv Chapter",
      description: 'Read a full KJV chapter from GetBible.',
      inputSchema: z.object( { book: z.string().describe('Book name like john.').optional(), chapter: z.number().describe('Chapter number.').optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await kjvChapter(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "translation_catalogue",
    {
      title: "Translation catalogue",
      description: "Every Bible translation bible-api.com serves, with language and licence, optionally filtered to one language.",
      inputSchema: z.object( { language: z.string().describe("Only this language, e.g. English.").optional(), limit: z.number().describe("Max translations.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement catalogue locally (paywall removed)
    try { return textError("Not yet implemented: catalogue") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "bible_books",
    {
      title: "Bible books",
      description: "The 66 KJV books in canonical order, filtered to the Old or New Testament, with each book's API url.",
      inputSchema: z.object( { testament: z.string().describe("all, old or new.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await bibleBooks(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "book_chapters",
    {
      title: "Book chapters",
      description: "Chapter and verse counts for one KJV book, by number or name, with its first verse.",
      inputSchema: z.object( { book: z.string().describe("Book number 1 to 66, or a name like Genesis.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement chapters locally (paywall removed)
    try { return textError("Not yet implemented: chapters") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
