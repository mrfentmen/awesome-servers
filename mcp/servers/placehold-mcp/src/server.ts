import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { image } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "placehold-mcp", version: "1.0.0" })
  server.registerTool(
    "image",
    {
      title: "Image",
      description: "Placeholder image URL.",
      inputSchema: z.object( { width: z.number().describe("Width.").optional(), height: z.number().describe("Height.").optional(), text: z.string().describe("Optional label text.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await image(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "svg_source",
    {
      title: "SVG source",
      description: "Fetch the actual SVG markup placehold.co generates for a size, caption and colours, so it can be saved to a file or inlined into markup.",
      inputSchema: z.object( { width: z.number().describe("Width in pixels.").optional(), height: z.number().describe("Height in pixels, defaults to width.").optional(), text: z.string().describe("Caption to draw on the image.").optional(), background: z.string().describe("Background colour or hex.").optional(), foreground: z.string().describe("Text colour or hex.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement source locally (paywall removed)
    try { return textError("Not yet implemented: source") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
