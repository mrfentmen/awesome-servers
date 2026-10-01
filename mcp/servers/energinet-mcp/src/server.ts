import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { errorMessage, getPowerNow, getDataset, dayAheadPrices } from "./api.js"
import { premiumRequired } from "./license.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "energinet-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "get_power_now",
    {
      title: "Get live power system",
      description: "Live Danish power system: production, consumption, exchange right now.",
      inputSchema: z.object({
        limit: z.number().default(5).describe("How many rows"),
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        return text(await getPowerNow(limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_dataset",
    {
      title: "Query any dataset",
      description: "Rows from any Energinet open dataset by name.",
      inputSchema: z.object({
        dataset: z.string().describe("Dataset name"),
        limit: z.number().default(5).describe("How many rows"),
      }),
      annotations: READ_ONLY,
    },
    async ({ dataset, limit }) => {
      try {
        return text(await getDataset(dataset, limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "day_ahead_prices",
    {
      title: "Day-ahead prices",
      description: "Energinet day-ahead electricity prices hour by hour across the Nordic and German bidding zones, with the cheapest and dearest row called out.",
      inputSchema: z.object( { hours: z.number().describe("How many hours to list, 1 to 48.").optional(), zone: z.string().describe("Restrict to one price area, e.g. DK1 or DE.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: day_ahead_prices ----
    const paywallMessage = await premiumRequired("day_ahead_prices")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try {
      return text(await dayAheadPrices(args));
    } catch (e) {
      return textError(errorMessage(e));
    }
    }
  );

  return server
}
