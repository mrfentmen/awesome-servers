import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { dataset, datasetSearch } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "cdc-data-mcp", version: "1.0.0" })
  server.registerTool(
    "dataset",
    {
      title: "Dataset",
      description: "Query a CDC Socrata dataset.",
      inputSchema: z.object( { dataset_id: z.string().describe("Socrata dataset id like 9dzk-mvmi."), limit: z.number().describe("Max rows.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await dataset(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "dataset_metadata",
    {
      title: "Dataset metadata",
      description: "Schema and provenance for a CDC dataset: asset type, licence, update dates, view and download counts, and every column with its data type.",
      inputSchema: z.object( { dataset_id: z.string().describe("Socrata dataset id, e.g. bugr-bbfr."), show_columns: z.boolean().describe("Include per-column detail.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement metadata locally (paywall removed)
    try { return textError("Not yet implemented: metadata") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "dataset_aggregate",
    {
      title: "Dataset aggregate",
      description: "Run a read-only SoQL aggregation against a CDC dataset with select, where, group and order, for counts, group-by breakdowns and sums.",
      inputSchema: z.object( { dataset_id: z.string().describe("Socrata dataset id, e.g. bugr-bbfr."), select: z.string().describe("SoQL select, e.g. count(*) or state, count(*) as n."), where: z.string().describe("SoQL where filter.").optional(), group: z.string().describe("Group-by expression.").optional(), order: z.string().describe("Order-by expression.").optional(), limit: z.number().describe("Max rows.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement aggregate locally (paywall removed)
    try { return textError("Not yet implemented: aggregate") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "dataset_search",
    {
      title: "Dataset search",
      description: "Search the CDC open data catalog by keyword to discover dataset ids you can then query.",
      inputSchema: z.object( { query: z.string().describe("Search words, e.g. COVID vaccine."), only: z.string().describe("dataset, chart or any.").optional(), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await datasetSearch(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
