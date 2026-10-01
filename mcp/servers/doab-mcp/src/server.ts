import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { errorMessage, searchBooks, getItem, browseDirectory, itemMetadata } from "./api.js"
import { premiumRequired } from "./license.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "doab-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_books",
    {
      title: "Search books",
      description: "Search DOAB open access books by keyword with handles and dates.",
      inputSchema: z.object({
        query: z.string().describe("Search text"),
      }),
      annotations: READ_ONLY,
    },
    async ({ query }) => {
      try {
        return text(await searchBooks(query));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_item",
    {
      title: "Get item by handle",
      description: "DOAB record by handle prefix and suffix, e.g. 20.500.12854 and 170275.",
      inputSchema: z.object({
        prefix: z.string().describe("Handle prefix"),
        suffix: z.string().describe("Handle suffix"),
      }),
      annotations: READ_ONLY,
    },
    async ({ prefix, suffix }) => {
      try {
        return text(await getItem(prefix, suffix));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "browse_directory",
    {
      title: "Browse the directory",
      description: "List DOAB's own structure: its top-level communities or collections, or the children of one you name by handle.",
      inputSchema: z.object( { kind: z.string().describe("collections or communities.").optional(), parent: z.string().describe("Parent handle, e.g. 20.500.12854/6.").optional(), limit: z.number().describe("Max entries.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: browse_directory ----
    const paywallMessage = await premiumRequired("browse_directory")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try {
      return text(await browseDirectory(args));
    } catch (e) {
      return textError(errorMessage(e));
    }
    }
  );

  server.registerTool(
    "item_metadata",
    {
      title: "Item metadata",
      description: "One DOAB item with its metadata expanded: title, author, date, language, abstract, license and the collections it belongs to.",
      inputSchema: z.object( { handle: z.string().describe("DOAB handle, e.g. 20.500.12854/70295.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: item_metadata ----
    const paywallMessage = await premiumRequired("item_metadata")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try {
      return text(await itemMetadata(args));
    } catch (e) {
      return textError(errorMessage(e));
    }
    }
  );

  return server
}
