import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { wordScore } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "scrabble-mcp", version: "1.0.0" })
  server.registerTool(
    "word_score",
    {
      title: "Word score",
      description: "Score a word in Scrabble.",
      inputSchema: z.object( { word: z.string().describe("The word to score.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await wordScore(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "score_with_blanks",
    {
      title: "Score with blanks",
      description: "Score a word that may use blank tiles, written as ? _ or *. The word_score tool cannot do this: it strips anything that is not a letter. Letters score their normal value in either case and blanks count as zero.",
      inputSchema: z.object( { word: z.string().describe("A word, using ? _ or * where a blank stands in for a letter, like CRAN?S.") } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: score_with_blanks ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_scrabble_score_with_blanks", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "tile_check",
    {
      title: "Tile check",
      description: "Whether a word can actually be laid down from one set, by comparing it against the real letter distribution instead of only scoring it.",
      inputSchema: z.object( { word: z.string().describe("A word to check, like pizzazz.") } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: tile_check ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_scrabble_tile_check", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
