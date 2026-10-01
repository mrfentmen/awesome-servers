import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { books, chapters } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "lotr-mcp", version: "1.0.0" })
  server.registerTool(
    "books",
    {
      title: "Books",
      description: "List the Lord of the Rings books.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await books(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "chapters",
    {
      title: "Chapters",
      description: "Chapters for a book.",
      inputSchema: z.object( { bookId: z.string().describe("Book ID.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await chapters(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "gateway_page",
    {
      title: "Gateway page",
      description: "A Tolkien Gateway article rendered as plain text: characters, places, peoples, items and books of Middle-earth.",
      inputSchema: z.object( { title: z.string().max(120).describe("Tolkien Gateway page title, e.g. Gandalf."), maxChars: z.number().int().min(200).max(6000).default(1200) }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: gateway_page ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_lotr_gateway_page", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "gateway_categories",
    {
      title: "Gateway categories",
      description: "The Tolkien Gateway categories a page belongs to, which is how the wiki sorts characters by appearance, era and work.",
      inputSchema: z.object( { title: z.string().max(120).describe("Tolkien Gateway page title, e.g. Gandalf."), limit: z.number().int().min(1).max(100).default(20) }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: gateway_categories ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_lotr_gateway_categories", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
