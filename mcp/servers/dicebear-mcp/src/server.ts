import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { generateAvatar } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })
const errorMessage = (e: unknown): string => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "dicebear-mcp", version: "1.0.0" })

  server.tool(
    "generate_avatar",
    "Avatar URL and SVG for a seed",
    { style: z.string().min(2).default("avataaars").describe("Style, e.g. avataaars, bottts or pixel-art"), seed: z.string().min(1).describe("Seed text, e.g. a name") },
    async ({ style, seed }) => {
      try {
        return text(await generateAvatar(style, seed))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
