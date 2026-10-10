import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { size } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "bundlephobia-mcp", version: "1.0.0" })
  server.registerTool(
    "size",
    {
      title: "Size",
      description: "Bundle size for a package.",
      inputSchema: z.object( { name: z.string().describe("Package name.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await size(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "package_comparison",
    {
      title: "Package comparison",
      description: "Measure several npm packages side by side and rank them by gzipped size.",
      inputSchema: z.object( { packages: z.string().describe("Comma separated packages, e.g. react@18.3.1,lodash@4.17.21.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: package_comparison ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_bundlephobia_package_comparison", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "package_metadata",
    {
      title: "Package metadata",
      description: "Description, repository, module type, side effects and the per-asset size breakdown of one package.",
      inputSchema: z.object( { name: z.string().describe("Package name, optionally with a version.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: package_metadata ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_bundlephobia_package_metadata", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
