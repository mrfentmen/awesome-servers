import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { crateInfo, searchCrates, crateLandscape } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "crates-io-mcp", version: "1.0.0" })
  server.registerTool(
    "crate_info",
    {
      title: "Crate info",
      description: "Get details for a Rust crate.",
      inputSchema: z.object( { name: z.string().describe("Crate name.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await crateInfo(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "search_crates",
    {
      title: "Search crates",
      description: "Search crates.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await searchCrates(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "crate_versions",
    {
      title: "Crate versions",
      description: "List every published version of a crate with download counts, publication dates, licences, minimum Rust version and which releases have been yanked.",
      inputSchema: z.object( { name: z.string().describe("Crate name."), limit: z.number().describe("Max versions.").optional(), include_yanked: z.boolean().describe("Include yanked releases.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: crate_versions ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_crates_io_crate_versions", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "crate_dependencies",
    {
      title: "Crate dependencies",
      description: "The full dependency list for a crate version, split into runtime, build and dev dependencies, marking optional crates, requested features and disabled default features.",
      inputSchema: z.object( { name: z.string().describe("Crate name."), version: z.string().describe("Version, defaults to the newest stable.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: crate_dependencies ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_crates_io_crate_dependencies", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "crate_landscape",
    {
      title: "Crate landscape",
      description: "Rank the crates.io ecosystem by total downloads, recent downloads or recency, optionally comparing specific crates side by side through the summary endpoint.",
      inputSchema: z.object( { sort: z.string().describe("downloads, recent-downloads, newest or updated.").optional(), limit: z.number().describe("Max crates.").optional(), compare: z.string().describe("Comma separated crate names to compare.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await crateLandscape(args)) } catch (e) { return textError(e instanceof Error ? `Error: ${e.message}` : String(e)) }
  }
  )

  return server
}
