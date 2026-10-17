import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { errorMessage, getAssetMetrics, listMetrics, metricDefinitions, candlePairs } from "./api.js"
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
        return textError(String(e));
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
        return textError(String(e));
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
    // TODO: implement catalog locally (paywall removed)
    try { return textError("Not yet implemented: catalog") } catch (e) { return textError(String(e)) }
    }
  );

  server.registerTool(
    "metric_definitions",
    {
      title: "Metric definitions",
      description: "Search the definitions, units, categories and data types of community metrics.",
      inputSchema: z.object({ search: z.string().describe("Search metric code, name or definition.").optional(), limit: z.number().describe("Maximum definitions, 1-30.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await metricDefinitions(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "candle_pairs",
    {
      title: "Candle pair availability",
      description: "Find trading pairs with available OHLC candles and history windows at each frequency.",
      inputSchema: z.object({ search: z.string().describe("Pair name filter.").optional(), limit: z.number().describe("Maximum pairs, 1-30.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await candlePairs(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "pair_candles",
    {
      title: "Pair OHLC candles",
      description: "Read open, high, low and close prices for a trading pair from the public CoinMetrics candle series.",
      inputSchema: z.object({ pair: z.string().describe("Pair identifier, default btc-usd.").optional(), frequency: z.string().describe("1m, 5m, 10m, 15m, 30m, 1h, 4h or 1d.").optional(), startTime: z.string().describe("Start ISO timestamp.").optional(), limit: z.number().describe("Maximum candles, 1-50.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement candles locally (paywall removed)
    try { return textError("Not yet implemented: candles") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
