import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { packageInfo, stats } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "jsdelivr-mcp", version: "1.0.0" })
  server.registerTool(
    "package",
    {
      title: "Package",
      description: "Versions for an npm package.",
      inputSchema: z.object( { name: z.string().describe("Package name like lodash.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await packageInfo(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "stats",
    {
      title: "Stats",
      description: "CDN usage statistics for an npm package.",
      inputSchema: z.object( { name: z.string().describe("Package name.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await stats(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "resolve_version",
    {
      title: "Resolve version",
      description: "Resolve a semver range or dist-tag for an npm package to the exact version jsDelivr would serve, so a build can be pinned.",
      inputSchema: z.object( { package: z.string().describe("npm package, e.g. express."), range: z.string().describe("Semver range or dist-tag.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: resolve_version ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_jsdelivr_resolve_version", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "version_detail",
    {
      title: "Version detail",
      description: "The published file tree of one exact version of an npm package, its top-level layout and its CDN url.",
      inputSchema: z.object( { package: z.string().describe("npm package, e.g. express."), version: z.string().describe("Exact version such as 4.22.3."), }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: version_detail ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_jsdelivr_version_detail", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "version_list",
    {
      title: "Version list",
      description: "Every published version of an npm package, newest first, with its dist-tags and any deprecation notices.",
      inputSchema: z.object( { package: z.string().describe("npm package, e.g. express."), limit: z.number().describe("Max versions.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: version_list ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_jsdelivr_version_list", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
