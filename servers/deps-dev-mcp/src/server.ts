import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { info, releaseHistory } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "deps-dev-mcp", version: "1.0.0" })
  server.registerTool(
    "info",
    {
      title: "Info",
      description: "Dependency data for one package version.",
      inputSchema: z.object( { system: z.string().describe("Ecosystem like npm or pypi."), name: z.string().describe("Package name."), version: z.string().describe("Version.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await info(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "release_history",
    {
      title: "Release history",
      description: "How a package has been released over time: the version count, the first and latest publish dates, how many versions are deprecated and how many major versions exist. The info tool prints only the fields at the top level of the response, which carry no version list.",
      inputSchema: z.object( { system: z.string().describe("Ecosystem like npm, pypi, maven, go or cargo."), name: z.string().describe("Package name.") } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await releaseHistory(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "version_detail",
    {
      title: "Version detail",
      description: "Everything deps.dev holds about one version: its licences, advisories, registries, provenance records, related source projects and links.",
      inputSchema: z.object( { system: z.string().describe("Ecosystem like npm, pypi, maven, go or cargo."), name: z.string().describe("Package name."), version: z.string().describe("The exact version to look up.") } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: version_detail ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_deps_dev_version_detail", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
