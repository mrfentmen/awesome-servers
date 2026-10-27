import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { averageInterestRates, monthlyTreasuryStatement, nationalDebt, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "fiscaldata-mcp", version: "1.0.0" })

  server.tool(
    "national_debt",
    "Latest total public debt outstanding, split by public and intragov holdings.",
    {
      history: z.number().int().min(1).max(30).default(1).describe("How many recent daily records")
    },
    async (a) => {
      try {
        return text(await nationalDebt(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "average_interest_rates",
    "Latest average interest rates on Treasury securities.",
    {
      limit: z.number().int().min(1).max(50).default(10).describe("Rows to return")
    },
    async (a) => {
      try {
        return text(await averageInterestRates(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "monthly_treasury_statement",
    "Latest Monthly Treasury Statement receipt and outlay rows.",
    {
      limit: z.number().int().min(1).max(50).default(10).describe("Rows to return")
    },
    async (a) => {
      try {
        return text(await monthlyTreasuryStatement(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  return server
}
