import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { format, latestIndex, listCollections, searchCaptures, collectionDetails } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const errorText = (error: unknown) => text(`Error: ${error instanceof Error ? error.message : String(error)}`)

export function createServer() {
  const server = new McpServer({ name: "commoncrawl-mcp", version: "1.0.0" })
  server.registerTool(
    "list_indexes",
    {
      title: "List indexes",
      description: "List available Common Crawl web crawl index collections, newest first.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
    try { return text(format((await listCollections()).slice(0, 30))) } catch (error) { return errorText(error) }
  }
  )
  server.registerTool(
    "latest_index",
    {
      title: "Latest index",
      description: "Return the identifier of the newest Common Crawl index collection.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
    try { return text(await latestIndex()) } catch (error) { return errorText(error) }
  }
  )
  server.registerTool(
    "search_captures",
    {
      title: "Search captures",
      description: "Find historical Common Crawl captures matching a URL or wildcard pattern. This returns index metadata, not page contents.",
      inputSchema: z.object( {
    url: z.string().min(1).max(500).describe("URL or wildcard pattern, for example example.com/*"),
    index: z.string().regex(/^[A-Za-z0-9._-]+$/).optional().describe("Optional collection id such as CC-MAIN-2025-30"),
    page: z.number().int().min(1).max(20).default(1),
    limit: z.number().int().min(1).max(100).default(20),
  }),
      annotations: READ_ONLY,
    },
    async ({ url, index, page, limit }) => {
    try { return text(format(await searchCaptures(url, index, page, limit))) } catch (error) { return errorText(error) }
  }
  )
  server.registerTool(
    "capture_history",
    {
      title: "Capture history",
      description: "Trace every Common Crawl capture of a URL or domain in a given index with capture timestamps, status codes, MIME types, payload digests and lengths, restricted to an optional year range.",
      inputSchema: z.object( { url: z.string().describe("URL or domain, e.g. example.com."), index: z.string().describe("Collection id, defaults to the latest.").optional(), match_type: z.string().describe("exact, prefix, host or domain.").optional(), from_year: z.number().describe("Only captures from this year onwards.").optional(), to_year: z.number().describe("Only captures up to this year.").optional(), limit: z.number().describe("Max records.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement history locally (paywall removed)
    try { return textError("Not yet implemented: history") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "index_stats",
    {
      title: "Index stats",
      description: "Profile a site as Common Crawl sees it: status code and MIME type distributions, 2xx share, scheme mix, URL path depth histogram and mean payload size over a sample of index records.",
      inputSchema: z.object( { url: z.string().describe("URL or domain to profile."), index: z.string().describe("Collection id, defaults to the latest.").optional(), match_type: z.string().describe("exact, prefix, host or domain.").optional(), sample: z.number().describe("Max records to sample.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement stats locally (paywall removed)
    try { return textError("Not yet implemented: stats") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "collection_details",
    {
      title: "Collection details",
      description: "Look up a specific Common Crawl collection by id with its timegate, CDX API endpoint, crawl window and total index size.",
      inputSchema: z.object( { id: z.string().describe("Collection id, e.g. CC-MAIN-2026-39.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await collectionDetails(args)) } catch (e) { return textError(e instanceof Error ? `Error: ${e.message}` : String(e)) }
  }
  )

  return server
}
