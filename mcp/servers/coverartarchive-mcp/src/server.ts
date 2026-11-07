import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { releaseArtwork } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })
const errorMessage = (e: unknown): string => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "coverartarchive-mcp", version: "1.0.0" })

  server.tool(
    "release_artwork",
    "Cover images for a MusicBrainz release",
    { release_id: z.string().min(30).describe("MusicBrainz release UUID") },
    async ({ release_id }) => {
      try {
        return text(await releaseArtwork(release_id))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
