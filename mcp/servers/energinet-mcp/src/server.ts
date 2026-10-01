import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { errorMessage, getPowerNow, getDataset, datasetCatalog, datasetSchema } from "./api.js"
import { premiumTool } from "./gateway.js"
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
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_energinet_day_ahead_prices", args)) } catch (e) { return textError(errorMessage(e)) }
    }
  );

  server.registerTool(
    "dataset_catalog",
    {
      title: "Dataset catalog",
      description: "Discover Energinet dataset identifiers, descriptions and last reported data updates.",
      inputSchema: z.object({ search: z.string().describe("Search name, title or description.").optional(), limit: z.number().describe("Maximum datasets, 1-30.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await datasetCatalog(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "dataset_schema",
    {
      title: "Dataset schema",
      description: "Read column meanings, units, types and temporal resolution before querying an Energinet dataset.",
      inputSchema: z.object({ dataset: z.string().describe("Dataset identifier from dataset_catalog."), limit: z.number().describe("Maximum columns, 1-60.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await datasetSchema(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "carbon_trend",
    {
      title: "Carbon intensity trend",
      description: "Summarize the latest Danish consumption carbon intensity samples by price area: range, mean, latest reading and change.",
      inputSchema: z.object({ samples: z.number().describe("Samples per area, 1-288, default 24.").optional(), zone: z.string().describe("DK1 or DK2; omit for both.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: carbon_trend ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_energinet_carbon_trend", args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  return server
}
