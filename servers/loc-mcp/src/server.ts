import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { audio, books, manuscripts, maps, newspapers, photos } from "./api.js"
import { search } from "./api.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "loc-mcp", version: "1.0.0" })
  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search Library of Congress items.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "photos",
    {
      title: "Photos",
      description: "Search LOC photos and prints.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await photos(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "books",
    {
      title: "Books",
      description: "Search LOC books.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await books(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "maps",
    {
      title: "Maps",
      description: "Search LOC maps.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await maps(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "audio",
    {
      title: "Audio",
      description: "Search LOC audio recordings.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await audio(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "newspapers",
    {
      title: "Newspapers",
      description: "Search LOC newspapers.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await newspapers(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "manuscripts",
    {
      title: "Manuscripts",
      description: "Search LOC manuscripts.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await manuscripts(args)) } catch (e) { return textError(error(e)) }
  }
  )
  return server
}
