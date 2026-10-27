import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { indicatorData, indicatorsForGoal, listSdgGoals, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "unstats-mcp", version: "1.0.0" })

  server.tool(
    "list_sdg_goals",
    "All 17 Sustainable Development Goals with descriptions.",
    {
      
    },
    async (a) => {
      try {
        return text(await listSdgGoals())
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "indicators_for_goal",
    "Indicators that measure one SDG goal.",
    {
      goal: z.number().int().min(1).max(17).describe("Goal number, 1 to 17")
    },
    async (a) => {
      try {
        return text(await indicatorsForGoal(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "indicator_data",
    "Official data rows for an indicator code.",
    {
      indicator: z.string().describe('Indicator code like "1.1.1"'),
      limit: z.number().int().min(1).max(50).default(10).describe("Rows to return"),
      areaCode: z.string().optional().describe("Optional country M49 code")
    },
    async (a) => {
      try {
        return text(await indicatorData(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  return server
}
