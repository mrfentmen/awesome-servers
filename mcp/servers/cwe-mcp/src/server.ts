import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { getWeakness, weaknessChildren, weaknessParents, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "cwe-mcp", version: "1.0.0" })

  server.tool(
    "get_weakness",
    "Full record for one CWE, including mitigations and consequences.",
    {
      id: z.number().int().positive().describe("CWE number, e.g. 79")
    },
    async (a) => {
      try {
        return text(await getWeakness(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "weakness_children",
    "More specific weaknesses that sit under a CWE.",
    {
      id: z.number().int().positive().describe("Parent CWE number"),
      limit: z.number().int().min(1).max(50).default(12).describe("Children to describe")
    },
    async (a) => {
      try {
        return text(await weaknessChildren(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "weakness_parents",
    "Broader weaknesses a CWE belongs to.",
    {
      id: z.number().int().positive().describe("CWE number")
    },
    async (a) => {
      try {
        return text(await weaknessParents(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  return server
}
