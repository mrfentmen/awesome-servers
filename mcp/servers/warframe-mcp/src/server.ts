import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { state, invasions, nightwave } from "./api.js"
import { premiumRequired } from "./license.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "warframe-mcp", version: "1.0.0" })
  server.registerTool(
    "state",
    {
      title: "State",
      description: "Current game state.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await state(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "invasions",
    {
      title: "Invasions",
      description: "Ongoing Grineer and Corpus invasions with node, defender and attacker rewards.",
      inputSchema: z.object( { limit: z.number().describe("Max invasions.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: invasions ----
    const paywallMessage = await premiumRequired("invasions")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await invasions(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "nightwave",
    {
      title: "Nightwave",
      description: "Current Nightwave season and its active challenges with reputation rewards.",
      inputSchema: z.object( { limit: z.number().describe("Max challenges.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await nightwave(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
