import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { getCard } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })
const errorMessage = (e: unknown): string => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "ygoprodeck-mcp", version: "1.0.0" })

  server.tool(
    "get_card",
    "Details for one Yu-Gi-Oh! card",
    { name: z.string().min(1).describe("Card name, e.g. Dark Magician") },
    async ({ name }) => {
      try {
        return text(await getCard(name))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
