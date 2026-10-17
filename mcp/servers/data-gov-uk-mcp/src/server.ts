import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { search, publisherDatasets } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "data-gov-uk-mcp", version: "1.0.0" })
  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search UK open data packages.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "dataset_detail",
    {
      title: "Dataset detail",
      description: "One data.gov.uk dataset in full: its publisher, licence, state, version, dates, tags, vocabularies and every downloadable resource with its format, its resource id and whether the table can be queried. The search tool returns only a title, a truncated note and a date.",
      inputSchema: z.object( { name: z.string().describe("The dataset slug, the part after data.gov.uk/dataset/.") } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement detail locally (paywall removed)
    try { return textError("Not yet implemented: detail") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "publisher_datasets",
    {
      title: "Publisher datasets",
      description: "Everything one publisher has put on data.gov.uk: how many datasets the catalogue holds for it and each one with its name, licence, resource count and formats and the date its metadata last changed. The search tool does free text only and cannot filter to a publisher.",
      inputSchema: z.object( { organization: z.string().describe("Publisher slug, the part after data.gov.uk/organisation/, e.g. open-data-ni. This is the name field, not the display title."), limit: z.number().describe("Max datasets, 1 to 25.").optional() } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await publisherDatasets(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
