import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { datasetDimensions, datasetValues, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "eurostat-mcp", version: "1.0.1" })

  server.tool(
    "dataset_values",
    "Values from a Eurostat dataset, filtered by dimension codes.",
    {
      dataset: z.string().regex(/^[a-z0-9_]{3,50}$/).describe("Dataset code, e.g. nama_10_gdp or une_rt_m"),
      filters: z.string().default("").describe('Dimension filters as a query string, e.g. geo=DE&unit=CP_MEUR. Empty means unfiltered'),
      lastTimePeriod: z.number().int().min(1).max(40).default(1).describe("Keep only the last N time periods"),
      limit: z.number().int().min(1).max(40).default(10).describe("Values to return, largest first")
    },
    async (a) => {
      try {
        return text(await datasetValues(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "dataset_dimensions",
    "The dimensions a dataset exposes and the category codes seen in its latest slice.",
    {
      dataset: z.string().regex(/^[a-z0-9_]{3,50}$/).describe("Dataset code, e.g. nama_10_gdp")
    },
    async (a) => {
      try {
        return text(await datasetDimensions(a))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  return server
}
