import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { meta } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "html-meta-mcp", version: "1.0.0" })
  server.registerTool(
    "meta",
    {
      title: "Meta",
      description: "Meta and open graph tags for a URL.",
      inputSchema: z.object( { url: z.string().describe("URL to inspect.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await meta(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "http_info",
    {
      title: "HTTP info",
      description: "Status code, content type, length, server and cache headers for a URL, fetched without pulling the body.",
      inputSchema: z.object( { url: z.string().describe("URL to inspect.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: http_info ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_html_meta_http_info", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "robots",
    {
      title: "Robots rules",
      description: "Fetch a site's robots.txt and report the crawl rules and sitemaps it declares.",
      inputSchema: z.object( { url: z.string().describe("Site URL; /robots.txt is appended to its origin.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: robots ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_html_meta_robots", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
