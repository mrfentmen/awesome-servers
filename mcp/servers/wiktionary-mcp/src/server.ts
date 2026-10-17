import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { define, wordRevisions, searchEntries } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "wiktionary-mcp", version: "1.0.0" })
  server.registerTool(
    "define",
    {
      title: "Define",
      description: "Get the definition of a word.",
      inputSchema: z.object( { word: z.string().describe("The word to look up.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await define(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "word_languages",
    {
      title: "Word languages",
      description: "Every language the English Wiktionary has an entry for a word in, with the headword used in each language.",
      inputSchema: z.object( { word: z.string().describe("The word to look up."), limit: z.number().int().min(1).max(100).default(25).describe("Max languages.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement languages locally (paywall removed)
    try { return textError("Not yet implemented: languages") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "entry_sections",
    {
      title: "Entry sections",
      description: "The section outline of a Wiktionary entry: which languages it covers and whether each has etymology, pronunciation, nouns, verbs and so on.",
      inputSchema: z.object( { word: z.string().describe("The word to look up.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement sections locally (paywall removed)
    try { return textError("Not yet implemented: sections") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "word_revisions",
    {
      title: "Word revisions",
      description: "Recent edit history of a Wiktionary entry: who changed it, when, and their edit summary.",
      inputSchema: z.object( { word: z.string().describe("The word to look up."), limit: z.number().int().min(1).max(50).default(10).describe("Max revisions.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await wordRevisions(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "search_entries",
    {
      title: "Search entries",
      description: "Search Wiktionary entry text and return matching titles and snippets.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().optional() } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await searchEntries(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "entry_categories",
    {
      title: "Entry categories",
      description: "List the linguistic, regional and maintenance categories attached to a Wiktionary entry.",
      inputSchema: z.object( { word: z.string().describe("Entry title."), limit: z.number().optional() } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement categories locally (paywall removed)
    try { return textError("Not yet implemented: categories") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
