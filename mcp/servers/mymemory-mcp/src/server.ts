import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { translate } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })
const errorMessage = (e: unknown): string => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "mymemory-mcp", version: "1.0.0" })

  server.tool(
    "translate",
    "Translate text between two languages",
    { input: z.string().min(1).max(500).describe("Text to translate"), from_lang: z.string().length(2).default("en").describe("Source language, e.g. en"), to_lang: z.string().length(2).describe("Target language, e.g. es") },
    async ({ input, from_lang, to_lang }) => {
      try {
        return text(await translate(input, from_lang, to_lang))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
