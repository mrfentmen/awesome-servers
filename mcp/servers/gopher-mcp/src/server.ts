import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  DEFAULT_GHOST,
  DEFAULT_PORT,
  GopherError,
  cleanText,
  formatItem,
  gopherFetch,
  parseMenu,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

export function createServer(): McpServer {
  const server = new McpServer({
    name: "gopher-mcp",
    version: "1.0.0",
  })

  server.tool(
    "open_menu",
    "Open a Gopher menu (directory) and list its items. The default " +
      "server is gopher.floodgap.com — one of the oldest still-running " +
      "gopher servers. Pass a selector like '/' for the root, or a path " +
      "like '/1/floodgap'.",
    {
      host: z.string().default(DEFAULT_GHOST).describe("Gopher host (no scheme)"),
      selector: z.string().default("/").describe("Menu selector, e.g. '/' or '/1/floodgap'"),
      port: z.number().int().default(DEFAULT_PORT).describe("Gopher port, usually 70"),
    },
    async ({ host, selector, port }) => {
      try {
        const body = await gopherFetch(host, selector, port)
        const items = parseMenu(body, host)
        if (items.length === 0) return text(`Empty menu at gopher://${host}:${port}/${selector}`)
        return text(
          `gopher://${host}:${port}/${selector}\n\n` +
            items.map((it, i) => formatItem(it, i)).join("\n")
        )
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "read_textfile",
    "Read a plain-text file from gopherspace (gopher type 0). Useful for " +
      "the floodgap texts, old FAQ collections, and historical documents.",
    {
      host: z.string().default(DEFAULT_GHOST),
      selector: z.string().describe("File selector, e.g. '/0/floodgap/new'"),
      maxChars: z.number().int().min(500).max(50000).default(10000),
    },
    async ({ host, selector, maxChars }) => {
      try {
        const body = await gopherFetch(host, selector)
        const cleaned = cleanText(body)
        if (!cleaned.trim()) return text(`Empty file at gopher://${host}/${selector}`)
        return text(cleaned.slice(0, maxChars))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "search_veronica",
    "Run a Gopher search (type 7) — e.g. a Veronica-2 search on " +
      "gopher.floodgap.com (selector '/7/v2/vs'). Returns matching items " +
      "as a menu.",
    {
      host: z.string().default(DEFAULT_GHOST),
      selector: z.string().default("/v2/vs").describe("Search selector, typically /v2/vs on floodgap"),
      query: z.string().describe("Search terms"),
      port: z.number().int().default(DEFAULT_PORT),
    },
    async ({ host, selector, query, port }) => {
      try {
        const body = await gopherFetch(host, `${selector}\t${query}`, port)
        const items = parseMenu(body, host)
        if (items.length === 0) return text(`No results for "${query}" on ${host}.`)
        return text(
          `Veronica search "${query}" via gopher://${host}:${port}/${selector}\n\n` +
            items.slice(0, 40).map((it, i) => formatItem(it, i)).join("\n")
        )
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof GopherError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
