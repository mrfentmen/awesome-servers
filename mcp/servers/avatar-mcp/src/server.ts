import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { avatarUrl, initialsAvatar, avatarStyleCatalog } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "avatar-mcp", version: "1.0.0" })
  server.registerTool(
    "initials_avatar",
    {
      title: "Initials avatar",
      description: "Get an avatar SVG for a name.",
      inputSchema: z.object( { name: z.string().describe("Name to use for initials."), style: z.string().describe("Style like initials, pixel-art, or lorelei.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await initialsAvatar(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "avatar_url",
    {
      title: "Avatar url",
      description: "Get the avatar URL without fetching the image.",
      inputSchema: z.object( { name: z.string().describe("Name to use."), style: z.string().describe("Style.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await avatarUrl(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "avatar_gallery",
    {
      title: "Avatar gallery",
      description: "Render one name in several DiceBear styles, checking each style is reachable.",
      inputSchema: z.object( { name: z.string().describe("Name to use for the seed."), styles: z.array(z.string()).describe("Styles to render, up to 8.").optional(), size: z.number().describe("Pixel size, 16-512.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement gallery locally (paywall removed)
    try { return textError("Not yet implemented: gallery") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "avatar_batch",
    {
      title: "Avatar batch",
      description: "Build avatar URLs for a list of names in one style and output format.",
      inputSchema: z.object( { names: z.array(z.string()).describe("Names, up to 20."), style: z.string().describe("Style like initials or avataaars.").optional(), format: z.string().describe("svg, png, webp, avif or jpg.").optional(), size: z.number().describe("Pixel size, 16-512.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement batch locally (paywall removed)
    try { return textError("Not yet implemented: batch") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "avatar_style_catalog",
    {
      title: "Avatar style catalog",
      description: "Every DiceBear style this server supports, each checked live, plus the output formats available.",
      inputSchema: z.object( {  } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await avatarStyleCatalog(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
