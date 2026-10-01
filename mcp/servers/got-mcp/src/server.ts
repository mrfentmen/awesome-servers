import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { book, character, houses } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "got-mcp", version: "1.0.0" })
  server.registerTool(
    "book",
    {
      title: "Book",
      description: "Get a book by id.",
      inputSchema: z.object( { id: z.number().describe("Book id.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await book(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "character",
    {
      title: "Character",
      description: "Get a character by id.",
      inputSchema: z.object( { id: z.number().describe("Character id.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await character(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "houses",
    {
      title: "Houses",
      description: "List houses.",
      inputSchema: z.object( { limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await houses(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "list_books",
    {
      title: "List books",
      description: "Page through the twelve A Song of Ice and Fire books with release date, authors, page count, isbn and publisher.",
      inputSchema: z.object( { page: z.number().describe("Page number.").optional(), limit: z.number().describe("Max books.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: list_books ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_got_list_books", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "list_characters",
    {
      title: "List characters",
      description: "Page through the characters of A Song of Ice and Fire with gender, culture, titles and aliases, or filter a page down to one alias.",
      inputSchema: z.object( { page: z.number().describe("Page number.").optional(), limit: z.number().describe("Max characters.").optional(), alias: z.string().describe("Find the character with this alias.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: list_characters ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_got_list_characters", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
