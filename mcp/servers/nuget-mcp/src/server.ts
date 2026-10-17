import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { packageInfo, search } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "nuget-mcp", version: "1.0.0" })
  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search NuGet packages.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "package",
    {
      title: "Package",
      description: "Details for one package.",
      inputSchema: z.object( { packageId: z.string().describe("Package ID like Newtonsoft.Json.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await packageInfo(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "package_versions",
    {
      title: "Package versions",
      description: "Every version NuGet has published for a package, oldest to newest, from the NuGet flat container index.",
      inputSchema: z.object( { package_id: z.string().describe("Package ID like Newtonsoft.Json."), limit: z.number().int().min(1).max(200).default(20).describe("Max versions.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement versions locally (paywall removed)
    try { return textError("Not yet implemented: versions") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
