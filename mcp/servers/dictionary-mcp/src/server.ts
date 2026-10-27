import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { define, synonyms, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "dictionary-mcp", version: "1.0.0" })

  server.tool(
    "define",
    "Definitions of a word, grouped by part of speech.",
    {
      word: z.string().min(1).max(45).describe("Word to look up, e.g. serendipity"),
      definitionsPerSense: z.number().int().min(1).max(6).default(3).describe("Definitions to show per part of speech")
    },
    async (a) => {
      try {
        return text(await define(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "synonyms",
    "Synonyms and antonyms of a word, with pronunciation links.",
    {
      word: z.string().min(1).max(45).describe("Word to look up")
    },
    async (a) => {
      try {
        return text(await synonyms(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  return server
}
