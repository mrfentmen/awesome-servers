import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { record, search, record_versions } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "zenodo-mcp", version: "1.0.0" })
  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search Zenodo records.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "record",
    {
      title: "Record",
      description: "One record by ID.",
      inputSchema: z.object( { id: z.number().describe("Record ID.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await record(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "record_files",
    {
      title: "Record files",
      description: "List the files in a Zenodo record with their size, checksum and download link, plus the total size, the licence, the access right with a warning when a record is under embargo, and the share the largest file takes. This is the data a dataset is judged on, and the existing record tool shows none of it, so a record's contents and size are invisible through it.",
      inputSchema: z.object({
        id: z.number().int().positive().describe("Zenodo record ID, from a search result."),
        limit: z.number().int().min(1).max(50).optional().describe("How many files to list, largest first. Default 25."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // TODO: implement files locally (paywall removed)
      try { return textError("Not yet implemented: files") } catch (e) { return textError(String(e)) }
    }
  )

  server.registerTool(
    "record_impact",
    {
      title: "Record impact",
      description: "Report the download and view statistics a Zenodo record has accumulated, with the ratio of unique to total downloads read as broad use against one group refetching, downloads per view, downloads a day since deposit, and the difference between the all-time and per-version counts, which appears exactly when an earlier version absorbed some of the traffic. The existing tools read none of the statistics block, so an unused dataset and a heavily used one print identically.",
      inputSchema: z.object({
        id: z.number().int().positive().describe("Zenodo record ID."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // TODO: implement impact locally (paywall removed)
      try { return textError("Not yet implemented: impact") } catch (e) { return textError(String(e)) }
    }
  )

  server.registerTool(
    "record_versions",
    {
      title: "Record versions",
      description: "Walk the version history of a Zenodo record, showing each version's id, DOI, concept DOI, dates, file count and total size, noting when the title changed between versions, and warning explicitly when the record you asked about is not the newest so a DOI copied from it points at superseded content. The existing record tool reports no version at all.",
      inputSchema: z.object({
        id: z.number().int().positive().describe("Zenodo record ID."),
      }),
      annotations: READ_ONLY,
    },
    async ({ id }) => {
      try { return text(await record_versions({ id })) } catch (e) { return textError(String(e)) }
    }
  )

  server.registerTool(
    "search_facets",
    {
      title: "Search facets",
      description: "Read Zenodo's own bucket counts for a query: resource types, access status, file types, subjects and publication years across the whole result set, with each bucket's share of the total. search prints titles from the first page of results and reports none of this, so it cannot say what a query is actually made of. Zenodo returns only the leading buckets of each facet, so the counts are the top of each distribution and are reported as such.",
      inputSchema: z.object({ query: z.string().describe("Search query, for instance 'cancer' or 'paleontology'."), facet: z.string().describe("One facet to show: resource_type, access_status, file_type, subject or publication_date. Optional, all five by default.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement facets locally (paywall removed)
    try { return textError("Not yet implemented: facets") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
