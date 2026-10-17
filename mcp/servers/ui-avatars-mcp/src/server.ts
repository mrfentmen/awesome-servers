import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { avatar, gravatarProfile } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "ui-avatars-mcp", version: "1.0.0" })
  server.registerTool(
    "avatar",
    {
      title: "Avatar",
      description: "Avatar URL for a name.",
      inputSchema: z.object( { name: z.string().describe("Name or initials."), size: z.number().describe("Pixel size.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await avatar(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "gravatar",
    {
      title: "Gravatar URL",
      description: "Gravatar image URL for an email address. The URL is a pure local MD5 of the trimmed lowercase address, so no request is made.",
      inputSchema: z.object( { email: z.string().describe("Email address."), size: z.number().int().min(16).max(2048).default(200), default: z.string().describe("Fallback: 404, mp, identicon, retro, robohash, blank.").default("identicon"), rating: z.string().describe("g, pg, r or x.").default("g"), format: z.string().describe("jpg, png or gif.").default("png") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement gravatar locally (paywall removed)
    try { return textError("Not yet implemented: gravatar") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "gravatar_profile",
    {
      title: "Gravatar profile",
      description: "The public Gravatar profile registered for an email address: display name, username, location and profile URL.",
      inputSchema: z.object( { email: z.string().describe("Email address.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await gravatarProfile(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
