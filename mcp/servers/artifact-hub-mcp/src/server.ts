import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { search, hubStats } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "artifact-hub-mcp", version: "1.0.0" })
  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search Artifact Hub packages.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "package_detail",
    {
      title: "Package detail",
      description: "One Artifact Hub package in full: licence, maintainers, subscriptions, signing, the newest available versions and where the chart comes from. The search tool only returns one line per hit.",
      inputSchema: z.object( { kind: z.string().describe("Package kind like helm, olm, operatorhub or container."), repository: z.string().describe("Repository name, like prometheus-community."), name: z.string().describe("Package name, like prometheus.") } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: package_detail ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_artifact_hub_package_detail", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "hub_stats",
    {
      title: "Hub stats",
      description: "How much Artifact Hub holds: the totals for packages, repositories, organizations, users and security report snapshots, plus the most viewed packages today.",
      inputSchema: z.object( {  } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await hubStats()) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
