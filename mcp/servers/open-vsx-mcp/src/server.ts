import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { formatExtension, formatHit, getExtension, OpenVsxError, searchExtensions } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "open-vsx-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_extensions",
    {
      title: "Search extensions",
      description: "Search Open VSX for VS Code extensions: descriptions, download counts.",
      inputSchema: z.object({
        query: z.string().describe("Search text, e.g. 'python', 'vim', 'theme'"),
        limit: z.number().int().min(1).max(50).default(5),
      }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => {
      try {
        const results = await searchExtensions(query, limit)
        if (results.length === 0) return text(`No Open VSX extensions match "${query}".`)
        return text(`Open VSX results for "${query}":\n\n${results.map((e, i) => formatHit(e, i)).join("\n")}`)
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "get_extension",
    {
      title: "Get extension details",
      description: "Get an Open VSX extension: version, license, links, recent versions.",
      inputSchema: z.object({
        namespace: z.string().describe("Publisher namespace, e.g. 'rust-lang' (case-sensitive)"),
        name: z.string().describe("Extension name, e.g. 'rust-analyzer' (case-sensitive)"),
      }),
      annotations: READ_ONLY,
    },
    async ({ namespace, name }) => {
      try {
        return text(formatExtension(await getExtension(namespace, name)))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "namespace_search",
    {
      title: "Namespace search",
      description: "Search inside one extension namespace on open-vsx.org, which a free-text search cannot narrow to a single vendor.",
      inputSchema: z.object( { namespace: z.string().describe("Namespace, e.g. ms-python."), query: z.string().describe("Search term; leave empty for everything.").optional(), limit: z.number().describe("Max extensions.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: namespace_search ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_open_vsx_namespace_search", args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "publisher_extensions",
    {
      title: "Publisher extensions",
      description: "Every extension one publisher has released on open-vsx.org with version, rating and download count, which is how you audit a vendor's catalogue.",
      inputSchema: z.object( { publisher: z.string().describe("Publisher id, e.g. ms-python."), limit: z.number().describe("Max extensions.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: publisher_extensions ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_open_vsx_publisher_extensions", args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof OpenVsxError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
