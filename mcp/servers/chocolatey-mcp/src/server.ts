import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { search, popularPackages } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "chocolatey-mcp", version: "1.0.0" })
  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search Chocolatey packages.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "package_details",
    {
      title: "Package details",
      description: "Full Chocolatey metadata for a package's latest version: description, tags, dependencies, project, docs, source and licence.",
      inputSchema: z.object( { id: z.string().describe("Package id, e.g. git.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement details locally (paywall removed)
    try { return textError("Not yet implemented: details") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "package_versions",
    {
      title: "Package versions",
      description: "Every published version of a Chocolatey package with dates, per-version downloads and sizes.",
      inputSchema: z.object( { id: z.string().describe("Package id, e.g. git.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement versions locally (paywall removed)
    try { return textError("Not yet implemented: versions") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "popular_packages",
    {
      title: "Popular packages",
      description: "The most downloaded Chocolatey packages, ranked by total download count.",
      inputSchema: z.object( { limit: z.number().describe("Max packages.").optional(), approvedOnly: z.boolean().describe("Only community-approved packages.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await popularPackages(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
