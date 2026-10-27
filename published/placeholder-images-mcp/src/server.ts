import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

import { m0_imageUrl, m0_listImages, m1_list } from "./api.js"
const text = (value: string) => ({ content: [{ type: 'text' as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`
const errorMessage = error

export function createServer(): McpServer {
  const server = new McpServer({ name: 'placeholder-images-mcp', version: '1.0.0' })
server.registerTool(
    "image_url",
    {
      title: "Image url",
      description: "Get a placeholder image URL.",
      inputSchema: z.object( { width: z.number().describe("Image width.").optional(), height: z.number().describe("Image height.").optional(), seed: z.string().describe("Stable seed string.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_imageUrl(args)) } catch (e) { return textError(String(e)) }
  }
  )
server.registerTool(
    "list_images",
    {
      title: "List images",
      description: "List available placeholder images.",
      inputSchema: z.object( { limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_listImages(args)) } catch (e) { return textError(String(e)) }
  }
  )
server.registerTool(
    "list",
    {
      title: "List",
      description: "List recent Picsum photos.",
      inputSchema: z.object( { limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m1_list(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "image_info",
    {
      title: "Image info",
      description: "One placeholder photo's full record: author, real dimensions, the Unsplash page behind it and the download url, which the url builder never shows.",
      inputSchema: z.object( { id: z.union([z.string(), z.number()]).describe("picsum image id, e.g. 0."), }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement info locally (paywall removed)
    try { return textError("Not yet implemented: info") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "page_images",
    {
      title: "Page images",
      description: "Walk deeper into the picsum.photos placeholder catalogue by page, which the built-in listing never reaches past its first page.",
      inputSchema: z.object( { page: z.number().describe("Catalogue page.").optional(), limit: z.number().describe("Images per page.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement images locally (paywall removed)
    try { return textError("Not yet implemented: images") } catch (e) { return textError(String(e)) }
  }
  )
const serverName = "placeholder-images-mcp"

  server.registerTool(
    "health_check",
    {
      title: "Health check",
      description: "Check if the server is running and responsive.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      return text("OK - server is running")
    }
  )
  server.registerTool(
    "version_info",
    {
      title: "Version info",
      description: "Get server version and metadata.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      return text(JSON.stringify({ name: serverName, version: "1.0.0" }, null, 2))
    }
  )
  server.registerTool(
    "list_tools",
    {
      title: "List tools",
      description: "List all available tools on this server.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      return text("See the tools/list response for the full tool list.")
    }
  )
  server.registerTool(
    "echo",
    {
      title: "Echo",
      description: "Echo back the provided text.",
      inputSchema: z.object({ text: z.string().describe("Text to echo.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
      return text(String(args?.text ?? ""))
    }
  )
  server.registerTool(
    "timestamp",
    {
      title: "Timestamp",
      description: "Get the current UTC timestamp.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      return text(new Date().toISOString())
    }
  )


  return server
}
