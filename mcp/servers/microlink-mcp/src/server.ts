import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { preview, pageMetadata } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "microlink-mcp", version: "1.0.0" })
  server.registerTool(
    "preview",
    {
      title: "Preview",
      description: "Get a link preview.",
      inputSchema: z.object( { url: z.string().describe("Target URL.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await preview(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "page_metadata",
    {
      title: "Page metadata",
      description: "Read a page's title, description, language, author, publisher, date, share image and logo through Microlink.",
      inputSchema: z.object( { url: z.string().describe("Page URL, e.g. 'https://example.com'.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await pageMetadata(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "page_screenshot",
    {
      title: "Page screenshot",
      description: "Render a page to an image with Microlink and return the image url, format and pixel dimensions.",
      inputSchema: z.object( { url: z.string().describe("Page URL."), width: z.number().int().min(320).max(1920).default(1280).describe("Viewport width in pixels."), mobile: z.boolean().default(false).describe("Emulate a mobile device") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement screenshot locally (paywall removed)
    try { return textError("Not yet implemented: screenshot") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
