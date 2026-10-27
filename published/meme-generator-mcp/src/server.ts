import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

import { m0_caption, m0_templates } from "./api.js"
const text = (value: string) => ({ content: [{ type: 'text' as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`
const errorMessage = error

export function createServer(): McpServer {
  const server = new McpServer({ name: 'meme-generator-mcp', version: '1.0.0' })
server.registerTool(
    "templates",
    {
      title: "Templates",
      description: "List popular meme templates.",
      inputSchema: z.object( { limit: z.number().describe("Maximum results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_templates(args)) } catch (e) { return textError(String(e)) }
  }
  )
server.registerTool(
    "caption",
    {
      title: "Caption",
      description: "Build a caption URL for a template.",
      inputSchema: z.object( { template_id: z.string().describe("The Imgflip template ID."), top: z.string().describe("Top caption.").optional(), bottom: z.string().describe("Bottom caption.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_caption(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "template_search",
    {
      title: "Template search",
      description: "Search imgflip's template catalogue by name or id, which the full template list never lets you narrow down.",
      inputSchema: z.object( { query: z.string().describe("Word to look for, e.g. drake."), limit: z.number().describe("Max templates.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement search locally (paywall removed)
    try { return textError("Not yet implemented: search") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "meme_url",
    {
      title: "Meme url",
      description: "Build the captioned imgflip meme image url for a template without rendering it, which is what you embed in a document or a page.",
      inputSchema: z.object( { templateId: z.string().describe("Template id, e.g. 181913649."), top: z.string().describe("Top text.").optional(), bottom: z.string().describe("Bottom text.").optional(), maxWidth: z.number().describe("Width in pixels, up to 1200.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement url locally (paywall removed)
    try { return textError("Not yet implemented: url") } catch (e) { return textError(String(e)) }
  }
  )
const serverName = "meme-generator-mcp"

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
  server.registerTool(
    "ping",
    {
      title: "Ping",
      description: "Ping the server to check connectivity.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      return text("pong")
    }
  )


  return server
}
