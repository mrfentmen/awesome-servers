import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { errorMessage, getAssetMetrics, listMetrics, assetCatalog, metricCatalog, institutionCatalog, assetPerformance } from "./api.js"
import { premiumRequired } from "./license.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "coinmetrics-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "get_asset_metrics",
    {
      title: "Get asset metrics",
      description: "Coin Metrics time series, e.g. assets 'btc,eth', metrics 'PriceUSD', frequency '1d'.",
      inputSchema: z.object({
        assets: z.string().describe("Comma-separated assets"),
        metrics: z.string().describe("Comma-separated metrics"),
        startTime: z.string().describe("Start ISO date"),
        endTime: z.string().describe("End ISO date"),
        frequency: z.string().default("1d").describe("Frequency like 1d or 1h"),
      }),
      annotations: READ_ONLY,
    },
    async ({ assets, metrics, startTime, endTime, frequency }) => {
      try {
        return text(await getAssetMetrics(assets, metrics, startTime, endTime, frequency));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_metrics",
    {
      title: "List asset metrics",
      description: "Coin Metrics metric catalog for assets with availability windows.",
      inputSchema: z.object({
        assets: z.string().describe("Comma-separated assets"),
      }),
      annotations: READ_ONLY,
    },
    async ({ assets }) => {
      try {
        return text(await listMetrics(assets));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "asset_catalog",
    {
      title: "Asset catalogue",
      description: "Every asset the CoinMetrics community API carries, with its metric count, available frequencies and the history window, so you know which id to query.",
      inputSchema: z.object( { search: z.string().describe("Filter by name or id, e.g. bitcoin.").optional(), limit: z.number().describe("Max assets.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: asset_catalog ----
    const paywallMessage = await premiumRequired("asset_catalog")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try {
      return text(await assetCatalog(args));
    } catch (e) {
      return textError(errorMessage(e));
    }
    }
  );

  server.registerTool(
    "metric_catalog",
    { title: "Metric catalogue", description: "Search CoinMetrics community metric definitions by name or category.", inputSchema: z.object({ search: z.string().optional(), limit: z.number().optional() }), annotations: READ_ONLY },
    async (args) => {
    // ---- paywall: metric_catalog ----
    const paywallMessage = await premiumRequired("metric_catalog")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await metricCatalog(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "institution_catalog",
    { title: "Institution catalogue", description: "List institutions and metric counts from CoinMetrics community data.", inputSchema: z.object({ search: z.string().optional(), limit: z.number().optional() }), annotations: READ_ONLY },
    async (args) => {
    try { return text(await institutionCatalog(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "asset_performance",
    { title: "Asset performance", description: "Compare one to five assets using daily USD prices: observed price change and daily range over 1-90 days.", inputSchema: z.object({ assets: z.string().describe("Comma-separated asset ids, default btc,eth.").optional(), days: z.number().describe("Lookback in days, 1-90; default 7.").optional() }), annotations: READ_ONLY },
    async (args) => {
    try { return text(await assetPerformance(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  return server
}
