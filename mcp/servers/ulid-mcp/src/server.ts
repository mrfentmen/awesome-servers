import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { compareUlids, generateUlid, parseUlid, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "ulid-mcp", version: "1.0.0" })

  server.tool(
    "generate_ulid",
    "Generate one or more ULIDs, optionally with a fixed timestamp.",
    {
      count: z.number().int().min(1).max(50).default(1).describe("How many ULIDs to generate"),
      timestamp: z.number().int().optional().describe("Unix milliseconds to embed (default: now)")
    },
    async (a) => {
      try {
        return text(await generateUlid(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "parse_ulid",
    "Decode a ULID into its timestamp and randomness parts.",
    {
      ulid: z.string().describe("26-character ULID")
    },
    async (a) => {
      try {
        return text(await parseUlid(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "compare_ulids",
    "Compare two ULIDs and show chronological order.",
    {
      first: z.string().describe("First ULID"),
      second: z.string().describe("Second ULID")
    },
    async (a) => {
      try {
        return text(await compareUlids(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  return server
}
