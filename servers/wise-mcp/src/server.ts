import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { exchangeRate, getBalances, listProfiles, WiseError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "wise-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_profiles",
    {
      title: "List profiles",
      description: "Your Wise profiles (personal, business) with ids.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        const rows = await listProfiles()
        if (rows.length === 0) return text("No Wise profiles.")
        return text(rows.map((p, i) => `${i + 1}. [${p.id}] ${p.name || p.type || "profile"}`).join("\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "get_balances",
    {
      title: "Get balances",
      description: "Balances per currency for one Wise profile.",
      inputSchema: z.object({
        profile_id: z.string().describe("Numeric profile id (use list_profiles)"),
      }),
      annotations: READ_ONLY,
    },
    async ({ profile_id }) => {
      try {
        const rows = await getBalances(profile_id)
        if (rows.length === 0) return text(`No balances for profile ${profile_id}.`)
        return text(rows.map((b, i) => `${i + 1}. ${b.amount ?? "?"} ${b.currency ?? "?"}`).join("\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "exchange_rate",
    {
      title: "Exchange rate",
      description: "Current Wise mid-market rate between two currencies.",
      inputSchema: z.object({
        from: z.string().describe("Source currency, e.g. 'USD'"),
        to: z.string().describe("Target currency, e.g. 'EUR'"),
      }),
      annotations: READ_ONLY,
    },
    async ({ from, to }) => {
      try {
        return text(`1 ${from.trim().toUpperCase()} = ${await exchangeRate(from, to)} ${to.trim().toUpperCase()}`)
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof WiseError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
