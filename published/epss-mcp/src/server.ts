import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { epssAboveThreshold, getEpssScore, topEpssScores, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "epss-mcp", version: "1.0.0" })

  server.tool(
    "get_epss_score",
    "Exploit probability and percentile for one CVE.",
    {
      cve: z.string().describe('CVE ID like "CVE-2024-3094"')
    },
    async (a) => {
      try {
        return text(await getEpssScore(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "top_epss_scores",
    "Highest-scoring CVEs right now.",
    {
      limit: z.number().int().min(1).max(50).default(10).describe("How many CVEs to return")
    },
    async (a) => {
      try {
        return text(await topEpssScores(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "epss_above_threshold",
    "List CVEs whose exploit probability is above a threshold.",
    {
      threshold: z.number().min(0).max(1).default(0.9).describe("Probability between 0 and 1"),
      limit: z.number().int().min(1).max(50).default(10).describe("How many CVEs to return")
    },
    async (a) => {
      try {
        return text(await epssAboveThreshold(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
