import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { colorInfo, colorScheme } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "color-mcp", version: "1.0.0" })
  server.registerTool(
    "color_info",
    {
      title: "Color info",
      description: "Get names and conversions for a color.",
      inputSchema: z.object( { hex: z.string().describe("Hex value like ff0000.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await colorInfo(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "color_scheme",
    {
      title: "Color scheme",
      description: "Generate a color scheme.",
      inputSchema: z.object( { hex: z.string().describe("Base hex value."), mode: z.string().describe("Scheme mode like monochrome or analogic.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await colorScheme(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "color_contrast",
    {
      title: "Color contrast",
      description: "WCAG contrast ratio between two hex colours, with the accessibility grade it reaches.",
      inputSchema: z.object( { foreground: z.string().describe("Text colour hex, e.g. ff0000."), background: z.string().describe("Background colour hex, e.g. ffffff.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement contrast locally (paywall removed)
    try { return textError("Not yet implemented: contrast") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "random_color",
    {
      title: "Random color",
      description: "A random colour from The Color API, with the full conversion set or a single format.",
      inputSchema: z.object( { format: z.string().describe("full, names, rgb, hsl, cmyk or hex.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement color locally (paywall removed)
    try { return textError("Not yet implemented: color") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
