import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { search, mirrorStatus } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "archlinux-mcp", version: "1.0.0" })
  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search Arch Linux packages.",
      inputSchema: z.object( { query: z.string().describe("Package query."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "package_details",
    {
      title: "Package details",
      description: "Full metadata for one Arch package by exact name: maintainers, licences, build date, sizes and the whole dependency graph.",
      inputSchema: z.object( { name: z.string().describe("Exact package name, e.g. linux.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: package_details ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_archlinux_package_details", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "reverse_dependencies",
    {
      title: "Reverse dependencies",
      description: "Find the Arch packages that depend on a package, or that provide a virtual capability, grouped by repository.",
      inputSchema: z.object( { name: z.string().describe("Package or capability name."), kind: z.string().describe("depends or provides.").optional(), limit: z.number().describe("Max packages.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: reverse_dependencies ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_archlinux_reverse_dependencies", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "mirror_status",
    {
      title: "Mirror status",
      description: "Arch mirrors ranked by score with delay, sync time, completion and protocols, optionally filtered to a country.",
      inputSchema: z.object( { country: z.string().describe("Country name fragment, e.g. Germany.").optional(), limit: z.number().describe("Max mirrors.").optional(), active_only: z.boolean().describe("Only active mirrors.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await mirrorStatus(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
